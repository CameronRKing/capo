<script>
import { formatDataName } from '../../utils.js';
import ToggleInput from '../../inputs/ToggleInput.vue';

export default {
    components: {
        ToggleInput,
    },
    props: ['settings'],
    methods: {
        formatDataName,
        persistSettings() {
            return this.$store.dispatch('saveResumeSettings', this.settings)
                .catch(() => swal(
                    'Whoops!',
                    'We were unable to save your settings. Support has been notified. Try refreshing the page.',
                    'error'
                ));
        }
    }
}
</script>



<template>
    <div class="card">
        <div class="card-content center-align">
            <div class="card-title"><i class="material-icons">settings</i>Settings</div>
            On a resume, I want to see:
            <table>
                <tr v-for="(_, key) in settings">
                    <td>{{ formatDataName(key) }}</td>
                    <td>
                        <ToggleInput
                            :value="settings[key]"
                            @input="value => { settings[key] = value; persistSettings(); }"
                        />
                    </td>
                </tr>
            </table>
        </div>
    </div>
</template>