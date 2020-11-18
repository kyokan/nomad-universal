import React, {ReactElement, useEffect} from "react";
import {useFetchUser, useUser} from "../../ducks/users";
import {
  getImageURLFromAvatarType,
  getImageURLFromPostHash
} from "../../utils/posts";
import "./avatar.scss";
import classNames = require("classnames");

export default function Avatar(props: {
  username: string,
  className?: string,
}): ReactElement {
  const user = useUser(props.username);

  const fetchUser = useFetchUser();

  useEffect(() => {
    fetchUser(props.username);
  }, [
    props.username,
    user?.profilePicture,
    user?.avatarType,
    user?.registered,
    user?.confirmed,
  ]);

  return (
    <img
      className={classNames(`avatar ${props.className}`, {
        'avatar__pending': user?.registered && !user?.confirmed,
        'avatar__not-registered': !user?.registered && !user?.confirmed,
      })}
      src={user?.profilePicture
        ? getImageURLFromPostHash(user.profilePicture)
        : getImageURLFromAvatarType(user?.avatarType || '', props.username)}
    />
  )
}
