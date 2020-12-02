import React, {ReactElement, useEffect, useState} from "react";
import classNames from "classnames";
import {INDEXER_API} from "../../utils/api";
import "./link-preview.scss";

type LinkPreviewProps = {
  className?: string;
  url: string;
  onOpenLink: (url: string) => void;
}

const HTML_CACHE: any = {};
const YT_CACHE: any = {};
const VID_CACHE: any = {};
const IMG_CACHE: any = {};
const URL_LOADING: any = {};

export default function LinkPreview(props: LinkPreviewProps): ReactElement {
  const [htmlProps, setHtmlProps] = useState<{
    url: string;
    title: string;
    siteName: string;
    description: string;
    images: string[];
    mediaType: string;
    contentType: string;
    videos: string[];
    favicons: string[];
  } | null>(null);
  const [youtubeProps, setYoutubeProps] = useState<{
    videoId: string;
    title: string;
    description: string;
    images: string[];
  } | null>(null);
  const [videoProps, setVideoProps] = useState<{
    videoUrl: string;
    title: string;
    description: string;
    images: string[];
  } | null>(null);
  const [imageProps, setImageProps] = useState<{
    title: string;
    description: string;
    imageUrl: string;
  }| null>(null);

  const [host, setHost] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async function onLinkPreviewMount() {
      try {
        if (URL_LOADING[props.url]) {
          return;
        }

        if (VID_CACHE[props.url]) {
          return setVideoProps(VID_CACHE[props.url]);
        }

        if (IMG_CACHE[props.url]) {
          return setImageProps(IMG_CACHE[props.url]);
        }

        if (HTML_CACHE[props.url]) {
          return setHtmlProps(HTML_CACHE[props.url]);
        }

        if (YT_CACHE[props.url]) {
          return setYoutubeProps(YT_CACHE[props.url]);
        }

        const url = new URL(props.url);

        setHost(url.hostname);

        URL_LOADING[props.url] = true;
        const resp = await fetch(`${INDEXER_API}/preview?url=${encodeURI(props.url)}`);
        const json = await resp.json();

        if (json.siteName === 'YouTube') {
          const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
          const match = props.url.match(regExp);
          if (match && match[2].length == 11) {
            setHtmlProps(null);
            setImageProps(null);
            setVideoProps(null);
            YT_CACHE[props.url] = {
              title: json.title,
              description: json.description,
              videoId: match[2],
              images: json.images,
            };
            setYoutubeProps(YT_CACHE[props.url]);
            return;
          }
        }

        if (json.mediaType === 'video.other' && json.siteName === 'Imgur') {
          setHtmlProps(null);
          setYoutubeProps(null);
          setImageProps(null);
          VID_CACHE[props.url] = {
            videoUrl: json.videos[0]?.url,
            title: json.title,
            description: json.description,
            images: json.images,
          };
          setVideoProps(VID_CACHE[props.url]);
          return;
        }

        if (json.mediaType === 'image') {
          setHtmlProps(null);
          setYoutubeProps(null);
          setVideoProps(null);
          IMG_CACHE[props.url] = {
            title: json.title,
            description: json.description,
            imageUrl: json.url,
          };
          setImageProps(IMG_CACHE[props.url]);
          return;
        }

        if (json.contentType === 'application/pdf') {
          setHtmlProps({
            ...json,
            url: json.url,
            title: json.contentType,
            siteName: url.host,
            images: [],
          });
          setYoutubeProps(null);
          setImageProps(null);
          setVideoProps(null);
          HTML_CACHE[props.url] = {
            ...json,
            url: json.url,
            title: json.contentType,
            siteName: url.host,
            images: [],
          };
          return;
        }

        if (json) {
          setHtmlProps(json);
          setYoutubeProps(null);
          setImageProps(null);
          setVideoProps(null);
          HTML_CACHE[props.url] = json;
          return;
        }

      } finally {
        setLoading(false);
        URL_LOADING[props.url] = false;
      }
    })();
  }, [props.url]);

  const [playingVideo, setPlaying] = useState(false);

  const body = (
    <div className="link-preview__body">
      <div className="link-preview__title">
        {htmlProps?.title || youtubeProps?.title || videoProps?.title}
      </div>
      <div className="link-preview__description">
        {htmlProps?.description || youtubeProps?.description || videoProps?.description}
      </div>
      <div className="link-preview__host">
        {host}
      </div>
    </div>
  );

  return (
    <div
      className={classNames('link-preview', props.className)}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (youtubeProps && !playingVideo) {
          setPlaying(true);
        } else if (videoProps && !playingVideo) {
          setPlaying(true);
        } else {
          props.onOpenLink!(props.url);
        }
      }}
    >
      {
        loading && (
          <div className="loader link-preview__loader" />
        )
      }
      {
        htmlProps?.images[0] && (
          <div
            className="link-preview__image"
            style={{
              backgroundImage: `url(${htmlProps?.images[0]})`,
            }}
          />
        )
      }
      {
        !youtubeProps?.videoId ? null : playingVideo
          ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeProps?.videoId}`}
              width="100%"
              height={360}
              loading="lazy"
              referrerPolicy="same-origin"
            />
          )
          : (
            <div
              className="link-preview__image"

              style={{
                backgroundImage: `url(${youtubeProps?.images[0]})`,
              }}
            />
          )
      }
      {
        !videoProps?.videoUrl ? null : playingVideo
          ? (
            <video
              src={videoProps?.videoUrl}
              width="100%"
              height={360}
              autoPlay
              controls
            />
          )
          : (
            <div
              className="link-preview__image"
              style={{
                backgroundImage: `url(${videoProps?.images[0]})`,
              }}
            />
          )
      }
      {
        imageProps && (
          <div
            className="link-preview__image-wrapper"
          >
            <div
              className="link-preview__image-wrapper__image-bg"
            />
            <div
              className="link-preview__image-wrapper__image"
              style={{backgroundImage: `url(${imageProps.imageUrl})`}}
            />
          </div>
        )
      }
      {
        playingVideo || imageProps
          ? null
          : body
      }
    </div>
  )
}
