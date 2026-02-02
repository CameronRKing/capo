<script>
import Resumes from '../../Resumes.js';
import VCard from '../VCard.vue';

export default {
    props: ['resume'],
    components: {
        VCard,
    },
    computed: {
        data() {
            return Resumes[this.resume.id - 1];
        },
        image() {
            return `/images/resumes/${this.resume.id}.png`;
        },
        labels() {
            const d = this.data;
            return {
                Education: d.education,
                Experience: d.experience,
                'Intelligence test': d.intelligence,
                'Myers-Briggs type': d.myers_briggs,
                'Other info': d.other_info,
                'Interview summary': d.interview,
                'Reference check': d.reference_check,
            };
        }
    },
}
</script>



<template>
    <VCard>
        <div slot="title" style="display: flex; align-items: center; justify-content: center; margin-right: 8px"><img :src="image" style="border-radius: 50%; width: 50px; height: 50px; object-fit: cover;" />{{ data.name }}</div>
        <div slot="content">
            <table>
                <tr v-for="(text, label) in labels">
                    <td class="label" style="padding: 8px">{{ label }}</td><td style="padding: 8px">{{ text }}</td></tr>
            </table>
        </div>
    </VCard>
</template>