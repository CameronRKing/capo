<template>
<div class="card resume-card">
    <div v-show="showList.picture" class="card-image">
        <img :src="image" />
        <span class="card-title">{{ resumeData.name }}</span>
    </div>
    <div class="card-stacked">
        <div class="card-content" :class="{activator: showList.additional_information}" :style="getMinHeight">
            <div v-show="!showList.picture" class="card-title black-text">{{ resumeData.name }}</div>

            <p v-show="showList.education"><b>Education:</b> {{ resumeData.education }}</p>
            <p v-show="showList.experience"><b>Experience:</b> {{ resumeData.experience }}</p>
            <template v-if="showList.test_scores">
                <p><b>Intelligence Test: </b> {{ resumeData.intelligence }}</p>
                <p><b>Myers-Briggs Type: </b> {{ resumeData.myers_briggs }}</p>
            </template>
            <p v-show="showList.other_info"><b>Other Info:</b> {{ resumeData.other_info }}</p>
            <br />
            <a v-show="showList.additional_information" href="#!" class="activator">Additional Information</a>
        </div>
        <div class="card-action">
            <ResumeGrouper :resume="resume" @update="$emit('update')" />
        </div>
    </div>
    <div class="card-reveal">
        <span class="card-title">Additional Information <i class="material-icons right">close</i></span>
        <p><b>Interview Summary:</b> {{ resumeData.interview }}</p>
        <p><b>Reference Check:</b> {{ resumeData.reference_check }}</p>
    </div>
</div>
</template>

<script>
import Resumes from '../../Resumes.js';
import ResumeGrouper from './ResumeGrouper.vue';

export default {
    components: {
        ResumeGrouper,
    },
    props: {
        resume: Object,
        showList: {
            type: Object,
            default: {
                picture: true,
                education: true,
                experience: true,
                test_scores: true,
                other_info: true,
                additional_information: true,
            }
        },
        height: {
            type: String,
            required: false
        }
    },
    computed: {
        resumeData() {
            return Resumes[this.resume.id - 1];
        },
        image() {
            return `/images/resumes/${this.resume.id}.png`;
        },
        getMinHeight() {
            if (!this.height) return {};

            return {
                'min-height': this.height
            };
        }
    },
};
</script>

<style scoped>
.card-content {
    height: 250px !important;
}
</style>
