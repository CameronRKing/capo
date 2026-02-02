<script>
import ResumeFlexViewer from './ResumeFlexViewer.vue';
import FullResume from './FullResume.vue';
import ProgressBar from '../ProgressBar.vue';

import {
    byGroupAndRank, getUnranked, getGroup, sortIntoGroup,
} from './ResumeUtils.js';

export default {
    props: ['resumes', 'settings'],
    components: {
        ResumeFlexViewer,
        FullResume,
        ProgressBar,
    },
    data() {
        return {
            selectedGroup: null,
        }
    },
    computed: {
        unranked() {
            return getUnranked(this.resumes);
        },
        allResumesAreRanked() {
            return this.unranked.length == 0;
        },
        selectedResumes() {
            if (this.selectedGroup) {
                return this.getGroup(this.selectedGroup);
            }
            return this.resumes.slice().sort(byGroupAndRank);
        },
        currentResumeCount() {
            return this.resumes.length - this.unranked.length + 1
        }
    },
    methods: {
        getGroup(group) {
            return getGroup(this.resumes, group);
        },
        handleGroupClick(group) {
            if (!this.allResumesAreRanked) {
                sortIntoGroup(this.resumes, this.unranked[0], group);
                this.$emit('update', this.resumes);
            } else {
                this.viewGroup(group);
            }
        },
        viewGroup(group) {
            this.selectedGroup = group;
        },
    }
}
</script>



<template>
<div style="display: flex;">
    <ul style="height: fit-content; background: white; padding: 8px; white-space: nowrap; margin-right: 16px;">
        <li v-if="allResumesAreRanked" class="group group-none" :class="{ selected: !selectedGroup }" @click="selectedGroup = null;">
            <span style="font-size: 24px;">ALL</span>
            <span class="supporting-text">{{ resumes.length }}</span>
        </li>
        <li @click="handleGroupClick('A')" class="group group-a" :class="{ selected: selectedGroup == 'A' }">
            <span style="font-size: 24px;">A</span>
            <span class="supporting-text">{{ getGroup('A').length }}</span>
        </li>
        <li @click="handleGroupClick('B')" class="group group-b" :class="{ selected: selectedGroup == 'B' }">
            <span style="font-size: 24px;">B</span>
            <span class="supporting-text">{{ getGroup('B').length }}</span>
        </li>
        <li @click="handleGroupClick('C')" class="group group-c" :class="{ selected: selectedGroup == 'C' }">
            <span style="font-size: 24px;">C</span>
            <span class="supporting-text">{{ getGroup('C').length }}</span>
        </li>
    </ul>

    <!-- if there are unranked resumes, ask the student to rank the next one -->
    <div v-if="!allResumesAreRanked">
        <h3 class="center-align white-text">
            <div>{{ currentResumeCount }} / {{ resumes.length }}</div>
            <ProgressBar :complete="currentResumeCount / resumes.length" />
        </h3>
        <FullResume :resume="unranked[0]" />
    </div>

    <!-- once that's done, display each group in a flex viewer -->
    <div v-if="allResumesAreRanked" style="flex-grow: 1">
        <ResumeFlexViewer
            :resumes="selectedResumes"
            :settings="settings"
            default-view="ResumeList"
            :sortable="true"
            @update="resumes => $emit('update', resumes)"
        />
    </div>
</div>
</template>

<style scoped>
.group {
    padding: 4px;
    border-radius: 2.5px;
}

.group:hover {
    cursor: pointer;
}

.group-none:hover, .group-none.selected {
    background: black;
    color: white;
}
</style>