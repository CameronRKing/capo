<script>
import ResumeGrid from './ResumeGrid.vue';
import ResumeList from './ResumeList.vue';

export default {
    props: {
        defaultView: {
            required: false,
            default: 'ResumeGrid',
        },
        resumes: {
            required: true,
            type: Array,
        },
        settings: {
            required: true,
            type: Object,
        },
        sortable: {
            required: true,
            type: Boolean,
        }  
    },
    data() {
        return {
            view: null,
        }
    },
    components: {
        ResumeGrid,
        ResumeList,
    },
    created() {
        this.view = this.defaultView;
    }
}
</script>



<template>
<div>
    <div class="white-text">
        <span v-if="view == 'ResumeGrid'"
            style="display: flex; align-items: center"
            @click="view = 'ResumeList'"
        >
            <i class="material-icons">view_list</i>
            Click here to switch to list view
        </span>
        <span v-if="view == 'ResumeList'"
            style="display: flex; align-items: center"
            @click="view = 'ResumeGrid'"
        >
            <i class="material-icons">view_module</i>
            Click here to switch to grid view
        </span>
    </div>

    <component
        style="margin: auto;"
        :is="view"
        :resumes="resumes"
        :show="settings"
        :sortable="sortable"
        @update="resumes => $emit('update', resumes)"
    />
</div>
</template>