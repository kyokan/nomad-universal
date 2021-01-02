import React, {ReactElement, ReactNode, useCallback} from "react";
import {withRouter, RouteComponentProps} from "react-router";
import Button from "../Button";

type PasswordLoginProps = {
  onNext: () => void;
  children?: ReactNode;
} & RouteComponentProps;

function Welcome(props: PasswordLoginProps): ReactElement {
  const onKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      props.onNext();
    }
  }, [props.onNext]);

  return (
    <div className="onboarding">
      <div className="onboarding__panel">
        {
          props.children
            ? props.children
            : (
              <>
                <div className="onboarding__panel__title">
                  {`Welcome to Nomad ✌️`}
                </div>
                <div className="onboarding__panel__paragraph">
                  Nomad is a peer-to-peer, ownerless social network built on top of Handshake and Footnote. It allows you to view and interact with content from owners of Handshake names.
                </div>
                <div className="onboarding__panel__paragraph">
                  Let's get started!
                </div>
              </>
            )
        }
        <div className="onboarding__panel__footer">
          <Button
            onClick={props.onNext}
          >
            Next
          </Button>
        </div>
      </div>

    </div>
  );
}

export default withRouter(Welcome);
