import {useSelector} from "react-redux";
import {useCurrentUsername} from "./users";
import {log} from "util";

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
  defaultList: Blocklist[];
}

const initialState: BlocklistState = {
  list: [],
  defaultList: [],
};

export const addBlocklist = (list: Blocklist, isDefault = false): BlocklistAction<any> => ({
  type: BlocklistActionType.ADD_BLOCKLIST,
  payload: {
    list,
    isDefault,
  },
});

export const removeBlocklist = (list: Blocklist, isDefault = false): BlocklistAction<any> => ({
  type: BlocklistActionType.ADD_BLOCKLIST,
  payload: {
    list,
    isDefault,
  },
});

export const useBlocklist = () => {
  const currentUser = useCurrentUsername();
  return useSelector((state: {blocklist: BlocklistState}) => {
    const {list, defaultList} = state.blocklist;
    const mergedList = list.concat(defaultList).map(({ connectorTLD }) => connectorTLD);
    const loggedIn = !!currentUser;
    const alreadyExists = list.find(({ connectorTLD }) => connectorTLD === currentUser);

    let mods: string[] = (!loggedIn || alreadyExists)
      ? mergedList
      : [currentUser].concat(mergedList);
    return mods;
  }, (a, b) => {
    return a.join(',') === b.join(',');
  });
};

export const useCustomBlocklist = () => {
  const currentUser = useCurrentUsername();
  return useSelector((state: {blocklist: BlocklistState}) => {
    const {list} = state.blocklist;
    const mergedList = list.map(({ connectorTLD }) => connectorTLD);
    const loggedIn = !!currentUser;
    const alreadyExists = list.find(({ connectorTLD }) => connectorTLD === currentUser);

    let mods: string[] = (!loggedIn || alreadyExists)
      ? mergedList
      : [currentUser].concat(mergedList);
    return mods;
  }, (a, b) => {
    return a.join(',') === b.join(',');
  });
};

export const useDefaultBlocklist = () => {
  return useSelector((state: {blocklist: BlocklistState}) => {
    const {defaultList} = state.blocklist;
    const mergedList = defaultList.map(({ connectorTLD }) => connectorTLD);

    return mergedList;
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

function reduceAddBlocklist(
  state: BlocklistState,
  action: BlocklistAction<{list: Blocklist; isDefault: boolean}>,
): BlocklistState {
  const {list, isDefault} = action.payload;
  const exist = state.list.find(({ connectorTLD }) => connectorTLD !== list.connectorTLD);

  return exist
    ? state
    : isDefault
      ? {
        ...state,
        defaultList: [...state.list, list],
      }
      : {
        ...state,
        list: [...state.list, list],
      };
}

function reduceRemoveBlocklist(
  state: BlocklistState,
  action: BlocklistAction<{list: Blocklist; isDefault: boolean}>,
): BlocklistState {
  const {list, isDefault} = action.payload;
  const exist = state.list.find(({ connectorTLD }) => connectorTLD !== list.connectorTLD);

  return !exist
    ? state
    : isDefault
      ? {
        ...state,
        defaultList: [...state.list, list],
      }
      : {
        ...state,
        list: [...state.list, list],
      };
}
