/* eslint-disable no-console */
export default {
  async onAuthStateChanged ({ commit, dispatch }, { authUser }) {
    if (!authUser) {
      commit('RESET_STORE')
      return
    }
    commit('SET_AUTH_USER', { authUser })

    //
    await dispatch('refreshCredential')
  },

  /**
   * Refreshes the state's "credential" list from Firebase.
   */
  async refreshCredential ({ commit, state }) {
    const fbUid = state.authUser.uid
    const ref = this.$fire.database.ref(`users/${fbUid}/credentials`)
    const snapshot = await ref.once('value')
    const credentials = snapshot.val() || []
    commit('SET_CREDENTIALS', credentials)
  },

  /**
   * Deletes a credential from Firebase, then forces a reset of the store.
   */
  async deleteCredential ({ commit, dispatch, state }, credId) {
    // Update the store before doing anything.
    await dispatch('refreshCredential')

    // Update the list, or if it will be empty after removing credId, delete it.
    const fbUid = state.authUser.uid
    const credentials = state.credentials.filter(cred => cred.credId !== credId)
    const ref = this.$fire.database.ref(`users/${fbUid}/credentials`)
    if (credentials.length > 0) {
      await ref.set(credentials)
    } else {
      await ref.remove()
    }

    // Run another store update to reflect the change.
    commit('SET_CREDENTIALS', credentials)
  },

  /**
   * Create a new credential in Firebase.
   */
  async createCredential ({ commit, dispatch, state }, credential) {
    await dispatch('refreshCredential')

    const fbUid = state.authUser.uid
    const ref = this.$fire.database.ref(`users/${fbUid}/credentials`)
    const newStateValue = [...state.credentials, credential]
    await ref.set(newStateValue)

    // Now that the new credential has been added, refresh the store again.
    commit('SET_CREDENTIALS', newStateValue)
  }
}
