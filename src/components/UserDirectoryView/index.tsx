import React, {ReactElement, UIEvent, useCallback, useEffect, useState} from "react";
import {withRouter, RouteComponentProps} from "react-router";
import "./user-dir.scss";
import {INDEXER_API} from "../../utils/api";
import {UserFollowingRow} from "../UserPanels";
import {Pageable} from "nomad-api/lib/src/services/indexer/Pageable";
import debounce from "lodash.debounce";

export default withRouter(UserDirectoryView);
function UserDirectoryView(props: RouteComponentProps): ReactElement {
  const [domains, setDomains] = useState<{
    tld: string;
    public_key: string;
    import_height: number;
  }[]>([]);

  const [next, setNext] = useState<number>(0);
  const [scrollLoading, setScrollLoading] = useState(false);
  const [scrollEl, setScrollEl] = useState<HTMLDivElement>();

  const query = useCallback(async () => {
    if (next < 0) return;
    const {items, next: _next} = await queryNext(next);
    setDomains([...domains, ...items]);
    setNext(_next || -1);
  }, [next, domains.map(d => d.tld).join(',')]);

  const _onScroll = useCallback(async (e: UIEvent<HTMLDivElement>) => {
    if (scrollLoading || !scrollEl) {
      return;
    }

    // @ts-ignore
    if (scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight * .65) {
      setScrollLoading(true);
      await query();
      setScrollLoading(false);
    }
  }, [scrollLoading, scrollEl, query]);

  const onScroll = debounce(_onScroll, 50, { leading: true });


  useEffect(() => {
    (async function onUserDirectoryMount () {
      const {items, next: _next} = await queryNext(0);
      setDomains(items);
      setNext(_next || -1);
    })()
  }, []);

  return (
    <div
      className="user-directory"
      // @ts-ignore
      ref={setScrollEl}
      onScroll={onScroll}
    >
      {domains.map((blobInfo) => {
        return (
          <UserFollowingRow username={blobInfo.tld} />
        );
      })}
    </div>
  )
}

async function queryNext(next = 0): Promise<Pageable<{
  tld: string;
  public_key: string;
  import_height: number;
}, number>> {
  const resp = await fetch(`${INDEXER_API}/tlds?limit=20&offset=${next}`);
  const json = await resp.json();

  if (json.error) {
    return Promise.reject(json.error);
  }

  return json.payload;
}
