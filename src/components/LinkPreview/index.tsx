import React, {ReactElement, useEffect, useState} from "react";
import classNames from "classnames";
import {INDEXER_API} from "../../utils/api";
import "./link-preview.scss";
import {url} from "inspector";
import Icon from "../Icon";
import {Simulate} from "react-dom/test-utils";
import playing = Simulate.playing;

type LinkPreviewProps = {
  className?: string;
  url: string;
  onOpenLink: (url: string) => void;
}

const CACHE: any = {};

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

  const [host, setHost] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async function onLinkPreviewMount() {
      try {
        if (CACHE[props.url]) {
          return setHtmlProps(CACHE[props.url]);
        }

        const url = new URL(props.url);
        setHost(url.hostname);
        const resp = await fetch(`${INDEXER_API}/preview?url=${encodeURI(props.url)}`);
        const json = await resp.json();

        if (json.mediaType === 'website') {
          setHtmlProps(json);
          setYoutubeProps(null);
          CACHE[props.url] = json;
          return;
        }

        if (json.siteName === 'YouTube') {
          const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
          const match = props.url.match(regExp);
          if (match && match[2].length == 11) {
            console.log(json);
            setYoutubeProps({
              title: json.title,
              description: json.description,
              videoId: match[2],
              images: json.images,
            });
            setHtmlProps(null);
            return;
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [props.url]);

  const [playingVideo, setPlaying] = useState(false);

  const body = (
    <div className="link-preview__body">
      <div className="link-preview__title">
        {htmlProps?.title || youtubeProps?.title}
      </div>
      <div className="link-preview__description">
        {htmlProps?.description || youtubeProps?.description}
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
              width={640}
              height={360}
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
        youtubeProps && playingVideo
          ? null
          : body
      }
    </div>
  )
}
