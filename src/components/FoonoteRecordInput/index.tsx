import React, {ReactElement} from "react";
import Icon from "../Icon";
import copy from "copy-to-clipboard";

type Props = {
  pubkey: string;
}

export default function FootnoteRecordInput(props: Props): ReactElement {
  return (
    <div className="onboarding__tld__content__pubkey">
      <input
        type="text"
        value={`f${props.pubkey}`}
        readOnly
      />
      <div className="onboarding__tld__content__pubkey__icon">
        <Icon
          width={18}
          material="file_copy"
          onClick={() => copy(`f${props.pubkey}`)}
        />
      </div>
    </div>
  );
}
