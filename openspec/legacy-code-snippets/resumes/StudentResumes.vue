<style>
/* found in resumes.scss */
</style>

<template>
<div id="student-resumes">
    <VTabs :tabs="tabs" ref="tabs" />

    <div id="staff" class="tab firsttab">
        <VCard v-if="unranked.length">
            <div slot="title">You have {{ unranked.length }} unranked resumes.</div>
            <div slot="content" class="center-align">
                <a href="#staff" data-cy="unranked-prompt" @click="selectTab('shortlist')">Click here to rank them.</a>
            </div>
        </VCard>

        <ResumeFlexViewer
            :resumes="hired"
            default-view="ResumeGrid"
            :settings="settings"
            :sortable="true"
            @update="updateHiredRankings"
        />
    </div>

    <div id="shortlist" class="tab">
        <ResumeRanker
            :resumes="resumes"
            :settings="settings"
            @update="updateRankings"
        />
    </div>

    <div id="combined" class="tab" style="display: flex;">
        <template v-if="hasShortlists">
            <div v-for="(shortlist, _) in teamShortlists" style="margin: 16px;">
                <h3 class="white-text">{{ shortlist.name }}</h3>
                <ResumeList
                    style="width: 280px; height: 500px; overflow: auto; margin-right: 32px;"
                    :resumes="shortlist.list"
                    :settings="settings"
                    :sortable="false"
                />
            </div>
        </template>
        <template v-if="!hasShortlists">
            <h2 class="white-text">Nobody has ranked their reps yet!</h2>
        </template>
    </div>

    <div id="settings" class="tab">
        <div class="row">
            <div class="col s12 m6 offset-m3">
                <ResumeSettings :settings="settings" />
            </div>
        </div>
    </div>
</div>
</template>

<script>
import { byGroupAndRank, getUnranked, getGroup } from '../components/resumes/ResumeUtils.js';
import { bordaCount } from '../utils.js';
import { resumesPath } from '../FirebaseService.js';

import VTabs from '../components/VTabs.vue';
import VCard from '../components/VCard.vue';
import ResumeFlexViewer from '../components/resumes/ResumeFlexViewer';
import ResumeRanker from '../components/resumes/ResumeRanker';
import ResumeList from '../components/resumes/ResumeList';
import ResumeSettings from '../components/resumes/ResumeSettings';

export default {
    components: {
        VTabs,
        VCard,
        ResumeFlexViewer,
        ResumeRanker,
        ResumeList,
        ResumeSettings,
    },
    data() {
        return {
            settings: {},
            swal: window.swal,
            teamShortlists: {},
            unsubscribe: null,
        }
    },
    created() {
        this.getStartingData();
        this.unsubscribe = this.livestreamRankings();
    },
    beforeDestroy() {
        this.unsubscribe()
    },
    computed: {
        resumes() {
            return this.$store.state.resumes;
        },
        context() {
            return this.$store.state.context;
        },
        name() {
            return this.$store.state.userName;
        },
        id() {
            return this.$store.state.userId;
        },
        currentReps() {
            return this.$store.state.currentReps;
        },
        hasShortlists() {
            return Object.keys(this.teamShortlists).length;
        },
        hiredHash() {
            return this.currentReps.reduce((acc, id) => ({...acc, [id]: true }), {});
        },
        tabs() {
            return [
                { href: '#staff', text: 'Current Staff' },
                { href: '#shortlist', text: 'My Rankings' },
                { href: '#combined', text: 'Team Rankings' },
            ];
        },
        hired() {
            return this.resumes.filter(r => this.hiredHash[r.id]).sort(byGroupAndRank);
        },
        unranked() {
            return getUnranked(this.resumes);
        }
    },
    methods: {
        selectTab(tab) {
            this.$refs.tabs.select(tab);
        },
        getStartingData() {
            return this.$store.dispatch('getStudentResumeData')
                .then(data => {
                    this.settings = data.settings;
                });
        },
        livestreamRankings() {
            return resumesPath(this.context).onSnapshot(doc => {
                this.teamShortlists = doc.data();
                if (this.hasShortlists) {
                    this.teamShortlists[0] = {
                        name: 'Combined',
                        list: bordaCount(Object.values(this.teamShortlists).map(s => s.list))
                    }
                }
            })
        },
        persistRankings() {
            resumesPath(this.context).set({ [this.id]: { name: this.name, list: this.resumes.sort((l, r) => l.rank < r.rank ? -1 : 1).map(r => r.id) }})
            return this.$store.dispatch('saveResumeRankings', this.resumes)
                .catch(() =>
                    swal(
                        'Whoops!',
                        'We were unable to save your rep rankings. An email has been sent to tech support. Try refreshing the page.',
                        'error'
                    )
                );
        },
        updateRankings(resumes) {
            resumes.forEach((r, idx) => r.rank = idx + 1);
            this.persistRankings();
        },
        // hired rep rankings are complicated
        // we have to reconcile a rep's ranking within the COMPANY
        // with the rep's ranking within ALL REPS.
        // to make life easy, we could just prevent students from ranking hired reps in the hired tab
        // but they seem to like the feature. So, what we'll do is this:
        // when students reorder reps in the hired tab,
        // we find all the hired reps in that group, take their rankings, and shuffle them around
        // e.g., if group A reps Alex, Sally, and Jacob have rankings 1, 5, and 7 respectively,
        // and the student ranks Jacob ahead of Sally in the hired tab,
        // the updated rankings should be Alex: 1, Jacob: 5, Sally: 7
        updateHiredRankings(hired) {
            if (getUnranked(hired).length != 0) {
                this.swal('', 'Try sorting all of your hired reps into groups before you rank them', 'info');
                return;
            }

            const hiredInGroup = group => this.getGroup(group).filter(r => hired.includes(r));
            ['A', 'B', 'C']
                .map(group => hiredInGroup(group))
                .forEach(group => this.updateRankingsWithinGroup(group, hired));
            this.persistRankings();
        },
        getGroup(group) {
            return getGroup(this.resumes, group);
        },
        // group contains the old rankings; the order of hired reflects the new rank relationships
        // for each position in hired, set the rank to the associated rank inside the relevant group
        updateRankingsWithinGroup(group, hired) {
            const ranks = group.map(r => r.rank);
            hired.filter(h => group.includes(h))
                .forEach((h, i) => h.rank = ranks[i]);
        },
        byGroupAndRank,
    }
};
</script>
