import React, {ReactElement, useCallback, useEffect, useState} from "react";
import {RouteComponentProps, withRouter} from "react-router-dom";
import "./profile-setting.scss";
import {useCurrentUsername, useFetchUser, useUser} from "../../ducks/users";
import {RawUserCard} from "../UserCard";
import {parseUsername} from "../../utils/user";
import Button from "../Button";
import {useSendPost} from "../../ducks/posts";
import {createNewDraft, DraftPost} from "../../ducks/drafts/type";
import Menuable from "../Menuable";
import {RelayerNewPostResponse} from "../../utils/types";
import RichTextEditor from "../RichTextEditor";
import Avatar from "../Avatar";
import {getImageURLFromAvatarType, getImageURLFromPostHash} from "../../utils/posts";

type Props = {
  sendPost?: (post: DraftPost) => Promise<RelayerNewPostResponse>
  onFileUpload: (cb: (file: File, skylink: string, prog: number) => Promise<void>) => Promise<void>;
} & RouteComponentProps;

function ProfileSetting(props: Props): ReactElement {
  const currentUsername = useCurrentUsername();
  const fetchUser = useFetchUser();
  const user = useUser(currentUsername);
  const { tld, subdomain } = parseUsername(currentUsername);
  const _sendPost = useSendPost();
  const sendPost = props.sendPost || _sendPost;
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const [defaultDisplayName, setDefaultDisplayName] = useState('');
  const [defaultBio, setDefaultBio] = useState<undefined|string>('');
  const [defaultProfilePicture, setDefaultProfilePicture] = useState('');
  const [defaultCoverImage, setDefaultCoverImage] = useState('');
  const [defaultAvatarType, setDefaultAvatarType] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState<string|undefined>(undefined);
  const [profilePicture, setProfilePicture] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [avatarType, setAvatarType] = useState('');

  const hasChanged = defaultDisplayName !== displayName
    || defaultBio !== bio
    || defaultProfilePicture !== profilePicture
    || defaultCoverImage !== coverImage
    || defaultAvatarType !== avatarType;

  const submit = useCallback(async () => {
    if (sending || success) return;

    setSending(true);
    setErrorMessage('');

    try {
      if (defaultAvatarType !== avatarType) {
        await sendPost(createNewDraft({
          content: avatarType,
          topic: '.avatar_type',
        }));
        setDefaultAvatarType(avatarType);
      }

      if (defaultCoverImage !== coverImage) {
        await sendPost(createNewDraft({
          content: coverImage,
          topic: '.cover_image_url',
        }));
        setDefaultCoverImage(coverImage);
      }

      if (defaultDisplayName !== displayName) {
        await sendPost(createNewDraft({
          content: displayName,
          topic: '.display_name',
        }));
        setDefaultDisplayName(displayName);
      }

      if (defaultProfilePicture !== profilePicture) {
        await sendPost(createNewDraft({
          content: profilePicture,
          topic: '.profile_picture_url',
        }));
        setDefaultProfilePicture(profilePicture);
      }

      if (defaultBio !== bio) {
        await sendPost(createNewDraft({
          content: bio,
          topic: '.user_bio',
        }));
        setDefaultBio(bio);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 1000);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSending(false);
    }

  }, [
    defaultDisplayName,
    defaultBio,
    defaultProfilePicture,
    defaultCoverImage,
    defaultAvatarType,
    avatarType,
    displayName,
    bio,
    profilePicture,
    coverImage,
    sending,
    errorMessage,
    success,
  ]);

  useEffect(() => {
    if (currentUsername) {
      fetchUser(currentUsername);
    }
  }, [currentUsername, fetchUser]);

  useEffect(() => {
    setProfilePicture(user?.profilePicture || '');
    setCoverImage(user?.coverImage || '');
    setDisplayName(user?.displayName || subdomain || tld);
    setBio(user?.bio);
    setAvatarType(user?.avatarType || '');
    setDefaultAvatarType(user?.avatarType || '');
    setDefaultProfilePicture(user?.profilePicture || '');
    setDefaultCoverImage(user?.coverImage || '');
    setDefaultDisplayName(user?.displayName || subdomain || tld);
    setDefaultBio(user?.bio);
  }, [
    user?.profilePicture,
    user?.coverImage,
    user?.displayName,
    user?.bio,
    user?.avatarType,
    subdomain,
    tld,
  ]);

  const [uploading, setUploading] = useState(false);

  const onSetAvatarType = useCallback(async (type: string) => {
    if (profilePicture) {
      setProfilePicture('');
    }

    setAvatarType(type)
  }, [profilePicture]);


  const onUploadProfileViaSia = useCallback(() => {
    setUploading(true);
    props.onFileUpload(async (file, skylink, prog) => {
      setProfilePicture(skylink);
      setUploading(false);
    });
  }, []);

  const onUploadCoverViaSia = useCallback(() => {
    setUploading(true);
    props.onFileUpload(async (file, skylink, prog) => {
      setCoverImage(skylink);
      setUploading(false);
    });
  }, []);


  return (
    <div className="profile-setting">
      <div className="setting__group">
        <div className="setting__group__content">
          <div className="setting__group__content__row">
            <div className="setting__group__content__row__label">
              Display Name:
            </div>
            <div className="setting__group__content__row__value">
              <input
                type="text"
                value={displayName}
                onChange={e => {
                  setDisplayName(e.target.value);
                  setErrorMessage('');
                }}
                disabled={!user?.confirmed}
              />
            </div>
          </div>
          <div className="setting__group__content__row profile-setting__bio-row">
            <div className="setting__group__content__row__label">
              Bio
            </div>
            <div className="setting__group__content__row__value">
              <RichTextEditor
                onChange={draft => {
                  setBio(draft.content);
                  setErrorMessage('');
                }}
                defaultContent={defaultBio}
                disabled={!user?.confirmed}
              />
            </div>
          </div>
          <div className="setting__group__content__row profile-setting__preview-row">
            <div className="setting__group__content__row__label">
              Preview:
            </div>
            <RawUserCard
              alias={displayName}
              username={currentUsername}
              coverImageUrl={coverImage}
              profilePictureUrl={profilePicture}
              avatarType={avatarType}
              bio={bio || ''}
            />
          </div>
          <div className="setting__group__content__row">
            <div className="setting__group__content__row__label">
              Profile Picture:
            </div>
            <div className="setting__group__content__row__value">
              <div className="profile-setting__images">
                <div className="profile-setting__images__group">
                  <div className="profile-setting__images__group__actions">
                    <Menuable
                      items={[
                        {
                          text: 'Choose from Avatars',
                          items: [
                            {
                              text: 'jdenticon',
                              onClick: () => onSetAvatarType('jdenticon'),
                            },
                            {
                              text: 'identicon',
                              onClick: () => onSetAvatarType('identicon'),
                            },
                          ]
                        },
                        {
                          text: 'Upload via Sia Skynet',
                          onClick: onUploadProfileViaSia,
                        },
                        {
                          text: 'Remove Profile Picture',
                          onClick: () => onSetAvatarType('_'),
                        },
                      ]}
                    >
                      <Button
                        disabled={!user?.confirmed || uploading}
                        loading={uploading}
                      >
                        Select File
                      </Button>
                    </Menuable>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="setting__group__content__row">
            <div className="setting__group__content__row__label">
              Cover Image:
            </div>
            <div className="setting__group__content__row__value">
              <div className="profile-setting__images">
                <div className="profile-setting__images__group">
                  <div className="profile-setting__images__group__actions">
                    <Menuable
                      items={[
                        {
                          text: 'Upload via Sia Skynet',
                          onClick: onUploadCoverViaSia,
                        },
                        {
                          text: 'Remove Profile Picture',
                          onClick: () => setCoverImage(''),
                        },
                      ]}
                    >
                      <Button
                        disabled={!user?.confirmed || uploading}
                        loading={uploading}
                      >
                        Select File
                      </Button>
                    </Menuable>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="profile-setting__error-message">
        {errorMessage}
      </div>
      <div className="profile-setting__footer">
        <Button
          disabled={!hasChanged || sending || success || !user?.confirmed}
          loading={sending}
          onClick={submit}
          color={success ? 'green' : 'default'}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}

export default withRouter(ProfileSetting);
