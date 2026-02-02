<script>
import VueDraggable from 'vuedraggable';
import ResumeGrouper from './ResumeGrouper.vue';
import Resumes from '../../Resumes.js';

export default {
    props: ['resumes', 'settings', 'sortable'],
    components: {
        ResumeGrouper,
        VueDraggable,
    },
    computed: {
        isSortable() {
            return Boolean(this.sortable);
        },
    },
    methods: {
        image(resume) {
            if (typeof resume == 'object')
                return `/images/resumes/${resume.id}.png`;
            return `/images/resumes/${resume}.png`
        },
        name(resume) {
            if (typeof resume == 'object')
                return Resumes[resume.id - 1].name;
            return Resumes[resume - 1].name;
        }
    }
}
</script>



<template>
    <div class="collection" style="max-width: 600px;">
        <div class="center-align" v-if="isSortable" style="padding: 8px; background: white"><i>Drag names up or down to change rankings</i></div>
        <VueDraggable v-if="isSortable"
            :value="resumes"
            @input="resumes => $emit('update', resumes)"
        >
            <div v-for="(resume, idx) in resumes" :data-cy="`rep-${resume.id}`" class="collection-item avatar" style="cursor: pointer; padding-left: 84px;">
                <div style="display: flex; align-items: center">
                    <span style="position: absolute; left: 8px;">{{ idx + 1 }}</span>
                    <i class="material-icons" style="position: absolute; left: 28px">select_all</i>
                    <img class="circle" style="left: 54px" :src="image(resume)" alt="" />
                    <span class="title" style="padding-left: 36px;">{{ name(resume) }}</span>
                </div>

                <div>
                    <ResumeGrouper :resume="resume" @update="$emit('update', resumes)" />
                </div>
            </div>
        </VueDraggable>

        <template v-if="!isSortable">
            <div v-for="resume in resumes" class="collection-item avatar">
                <div style="display: flex; align-items: center">
                    <img class="circle" :src="image(resume)" alt="" />
                    <span class="title">{{ name(resume) }}</span>
                </div>
            </div>
        </template>
    </div>
</template>



<style scoped>
.collection {
    background: white;
}

ol {
    padding-left: 0;
    margin: 0;
    height: 540px;
    overflow-y: auto;
}

.collection-item.avatar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 54px;
}

.collection-item.avatar img.circle {
    object-fit: cover;
}
</style>