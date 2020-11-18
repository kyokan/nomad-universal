import React, {ReactElement, useCallback, useState} from "react";
import {withRouter, RouteComponentProps} from "react-router";
import Button from "../Button";

type PasswordLoginProps = {
  onNext: () => void;
} & RouteComponentProps;

function Terms(props: PasswordLoginProps): ReactElement {
  const [accepted, accept] = useState(false);
  const onKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      props.onNext();
    }
  }, [props.onNext]);

  return (
    <div className="onboarding">
      <div className="onboarding__panel">
        <div className="onboarding__panel__title">
          {`Terms of Service 🧐️`}
        </div>
        <div className="onboarding__panel__content">
          <div className="onboarding__panel__paragraph">
            <div className="onboarding__panel__paragraph__list">1. Nomad is a peer-to-peer network without an owner.</div>
            <div className="onboarding__panel__paragraph__list">2. You own all the content you create.</div>
            <div className="onboarding__panel__paragraph__list">3. Please don't be malicious, abusive, or do anything illegal.</div>
            <div className="onboarding__panel__paragraph__list">4. Have fun! 😃</div>
          </div>
        </div>
        <div className="onboarding__panel__row">
          <input
            className="onboarding__panel__checkbox" type="checkbox"
            onChange={e => accept(e.target.checked)}
          />
          <div className="onboarding__panel__checkbox-label">I accept the terms of service</div>
        </div>
        <div className="onboarding__panel__footer">
          <Button
            onClick={props.onNext}
            disabled={!accepted}
          >
            Next
          </Button>
        </div>
      </div>

    </div>
  );
}

export default withRouter(Terms);
