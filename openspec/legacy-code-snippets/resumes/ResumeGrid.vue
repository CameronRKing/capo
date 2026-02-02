<script>
import VueDraggable from 'vuedraggable';
import ResumeCard from './ResumeCard.vue';

export default {
    props: ['resumes', 'show', 'sortable'],
    components: {
        VueDraggable,
        ResumeCard,  
    },
    computed: {
        isSortable() {
            return Boolean(this.sortable);
        }
    }
}
</script>



<template>
<div class="row resume-container">
    <div v-if="!isSortable"
        class="col s12 m6 l4"
        v-for="resume in resumes"
        transition="resume"
    >
        <ResumeCard :resume="resume" :show-list="show"></ResumeCard>
    </div>

    <VueDraggable v-if="isSortable"
        style="display: flex; flex-flow: row wrap;"
        :value="resumes"
        @input="resumes => $emit('update', resumes)"
    >
        <div class="col s12 m6 l4" v-for="resume in resumes" :data-id="resume.name">
            <i class="material-icons resume-handle">select_all</i>
            <ResumeCard :resume="resume" :show-list="show" @update="$emit('update', resumes)"></ResumeCard>
        </div>
    </VueDraggable>

</div>
</template>