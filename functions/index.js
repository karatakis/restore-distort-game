const admin = require("firebase-admin");
const functions = require("firebase-functions");
const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const shortid = require('shortid');

admin.initializeApp();

const typeDefs = gql`
  type CreateRoomResponse {
    id: String!
  }

  type JoinRoomResponse {
    master: String!
  }

  type Query {
    Hello: String!
  }

  type Mutation {
    CreateRoom (token: String!): CreateRoomResponse!
    JoinRoom (token: String!, room_id: String!): JoinRoomResponse!
  }
`;

const resolvers = {
  Query: {
    Hello: () => {
      return 'Hello World'
    }
  },
  Mutation: {
    CreateRoom: async (_, { token }) => {
      const tokenInfo = await admin.auth().verifyIdToken(token)
      const user = await admin.auth().getUser(tokenInfo.uid)

      const database = admin.database()

      const roomId = shortid.generate().slice(0, 6)
      const roomsRef = database.ref('rooms/' + roomId)

      roomsRef.set({
        created_at: admin.database.ServerValue.TIMESTAMP,
        round: 0,
        master: user.uid,
        headless: true,
        players: {
          [user.uid]: {
            name: shortid.generate(),
            online: false
          }
        },
        state: 'WAITING',
        state_data: {
          [user.uid]: false
        },
        rounds_data: [
          {
            [user.uid]: false
          }
        ]
      })

      return {
        id: roomId
      }
    },
    JoinRoom: async (_, { token, room_id }) => {
      const tokenInfo = await admin.auth().verifyIdToken(token)
      const user = await admin.auth().getUser(tokenInfo.uid)

      const database = admin.database()

      database.ref('rooms/' + room_id + '/players/' + user.uid).set({
        name: shortid.generate(),
        online: false
      })
      database.ref('rooms/' + room_id + '/rounds_data/0/' + user.uid).set(false)
      database.ref('rooms/' + room_id + '/state_data/' + user.uid).set(false)

      return {
        master: (await database.ref('rooms/' + room_id).once('value')).val().master
      }
    }
  }
}

// setup express cloud function
const app = express();
const server = new ApolloServer({ typeDefs, resolvers });
server.applyMiddleware({ app, path: "/", cors: true });

exports.graphql = functions.https.onRequest(app);
