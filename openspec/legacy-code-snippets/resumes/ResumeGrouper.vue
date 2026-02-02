<script>
import { sortIntoGroup } from './ResumeUtils.js';

export default {
    props: ['resume'],
    computed: {
        resumes() {
            return this.$store.state.resumes;
        }
    },
    methods: {
        sortIntoGroup(group) {
            sortIntoGroup(this.resumes, this.resume, group);
            this.$emit('update');
        }
    }
}
</script>



<template>
    <div class="group-btn-wrapper">
        <button class="btn btn-flat group-btn group-a" 
                :class="{selected: resume.group == 'A'}" 
                @click="sortIntoGroup('A')">A</button>
        <button class="btn btn-flat group-btn group-b" 
                :class="{selected: resume.group == 'B'}" 
                @click="sortIntoGroup('B')">B</button>
        <button class="btn btn-flat group-btn group-c" 
                :class="{selected: resume.group == 'C'}" 
                @click="sortIntoGroup('C')">C</button>
    </div>
</template>