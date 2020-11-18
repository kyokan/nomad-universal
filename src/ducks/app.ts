import {INDEXER_API} from "../utils/api";
import {useCallback} from "react";
import {shallowEqual, useDispatch, useSelector} from "react-redux";

export enum AppActionType {
  ADD_SYSTEM_MESSAGE = 'app/addSystemMessage',
  REMOVE_SYSTEM_MESSAGE = 'app/removeSystemMessage',
  SET_HANDSHAKE_END_HEIGHT = 'app/setHandshakeEndHeight',
  SET_LAST_SYNC = 'app/setLastSync',
}

export type SystemMessage<meta> = {
  text: string;
  type: 'info' | 'error' | 'success';
  meta?: meta;
}

type AppAction<payload> = {
  type: AppActionType;
  payload: payload;
  error?: boolean;
  meta?: any;
}

type AppState = {
  handshakeEndHeight: number;
  lastSync: number;
  messages: SystemMessage<any>[];
}

const initialState: AppState = {
  handshakeEndHeight: -1,
  lastSync: -1,
  messages: [],
};

export const addSystemMessage = (msg: SystemMessage<any>) => {
  return {
    type: AppActionType.ADD_SYSTEM_MESSAGE,
    payload: msg,
  };
};

export const useFetchHSDData = () => {
  const dispatch = useDispatch();
  return useCallback(async () => {
    const resp = await fetch(`${INDEXER_API}/hsd`);
    const json = await resp.json();
    dispatch({
      type: AppActionType.SET_HANDSHAKE_END_HEIGHT,
      payload: json.payload.chain.height,
    });
  }, [
    dispatch,
  ]);
};

export const useBlockHeight = () => {
  return useSelector((state: {app: AppState}) => {
    return state.app.handshakeEndHeight;
  }, shallowEqual);
};

export default function appReducer(state: AppState = initialState, action: AppAction<any>) {
  switch(action.type) {
    case AppActionType.SET_LAST_SYNC:
      return {
        ...state,
        lastSync: action.payload,
      };
    case AppActionType.ADD_SYSTEM_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case AppActionType.REMOVE_SYSTEM_MESSAGE:
      return {
        ...state,
        messages: state.messages.filter(message => message !== action.payload),
      };
    case AppActionType.SET_HANDSHAKE_END_HEIGHT:
      return {
        ...state,
        handshakeEndHeight: action.payload,
      };
    default:
      return state;
  }
}
