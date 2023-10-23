import { configureStore } from '@reduxjs/toolkit';

import authReducer from './authSlice';
import postReducer from './postSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    post: postReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
// Inferred type, app store, used for Axios interceptor setup
export type AppStore = typeof store;
