import 'babel-polyfill'
import ApolloClient from 'apollo-boost'
import gql from 'graphql-tag'

export default new ApolloClient({
  uri: 'https://us-central1-oss-ac-ip.cloudfunctions.net/graphql'
})

export const CreateRoom = gql`
mutation CreateRoom($token: String!) {
  CreateRoom(token: $token) {
    id
  }
}
`

export const JoinRoom = gql`
mutation JoinRoom($token: String!, $room_id: String!) {
  JoinRoom(token: $token, room_id: $room_id) {
    master
  }
}
`
