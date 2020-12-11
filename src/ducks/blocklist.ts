import {Dispatch} from "redux";
import {shallowEqual, useDispatch, useSelector} from "react-redux";
import {useCallback} from "react";
import {ThunkDispatch} from "redux-thunk";
import {useCurrentUsername} from "./users";

type Blocklist = {
  connectorTLD: string;
}

enum BlocklistActionType {
  ADD_BLOCKLIST = 'app/blocklist/addBlocklist',
  REMOVE_BLOCKLIST = 'app/blocklist/removeBlocklist',
}

type BlocklistAction<payload> = {
  type: BlocklistActionType;
  payload: payload;
  meta?: any;
  error?: boolean;
}

type BlocklistState = {
  list: Blocklist[];
}

const initialState: BlocklistState = {
  list: [],
};

export const addBlocklist = (payload: Blocklist): BlocklistAction<Blocklist> => ({
  type: BlocklistActionType.ADD_BLOCKLIST,
  payload,
});

export const removeBlocklist = (payload: Blocklist): BlocklistAction<Blocklist> => ({
  type: BlocklistActionType.ADD_BLOCKLIST,
  payload,
});

export const useBlocklist = () => {
  const currentUser = useCurrentUsername();
  return useSelector((state: {blocklist: BlocklistState}) => {
    const list = state.blocklist.list;
    let mods: string[] = (!currentUser || list.find(({ connectorTLD }) => connectorTLD === currentUser))
      ? list.map(({ connectorTLD }) => connectorTLD)
      : [currentUser].concat(list.map(({ connectorTLD }) => connectorTLD));
    return mods;
  }, (a, b) => {
    return a.join(',') === b.join(',');
  });
};

export default function blocklistReducer(state: BlocklistState = initialState, action: BlocklistAction<any>): BlocklistState {
  switch (action.type) {
    case BlocklistActionType.ADD_BLOCKLIST:
      return reduceAddBlocklist(state, action);
    case BlocklistActionType.REMOVE_BLOCKLIST:
      return reduceRemoveBlocklist(state, action);
    default:
      return state;
  }
}

function reduceAddBlocklist(state: BlocklistState, action: BlocklistAction<Blocklist>): BlocklistState {
  const blocklist = action.payload;
  const exist = state.list.find(({ connectorTLD }) => connectorTLD !== blocklist.connectorTLD);

  return exist
    ? state
    : {
      list: [...state.list, blocklist],
    };
}

function reduceRemoveBlocklist(state: BlocklistState, action: BlocklistAction<Blocklist>): BlocklistState {
  const blocklist = action.payload;
  const exist = state.list.find(({ connectorTLD }) => connectorTLD !== blocklist.connectorTLD);

  return !exist
    ? state
    : {
      list: state.list.filter(({ connectorTLD }) => connectorTLD !== blocklist.connectorTLD),
    };
}
