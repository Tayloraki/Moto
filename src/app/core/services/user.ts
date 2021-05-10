export interface User {
  uid: number
  email: string
  displayName: string
  emailVerified: boolean
  recipes: {
    name: string
    link: string
    //anything else
  }[]
}
