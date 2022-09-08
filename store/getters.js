export default {
  isLoggedIn: (state) => {
    try {
      return state.authUser.uid !== null
    } catch {
      return false
    }
  },
  idToken: state => state.idToken,
  authUser: (state) => {
    return state.authUser
  }
}
