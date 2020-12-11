import React, {ReactElement, useEffect, useState} from "react";
import classNames from "classnames";
import {INDEXER_API} from "../../utils/api";
import "./link-preview.scss";
import {replaceLink} from "../../utils/posts";

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
      const link = replaceLink(props.url);

      try {
        const url = new URL(link);

        setHost(url.hostname);

        if (url.hostname === 'siasky.net') {
          const resp = await fetch(link);
          const metadata = JSON.parse(resp.headers.get('skynet-file-metadata') || '');
          const subfiles = metadata?.subfiles || {};
          const filepath = metadata?.defaultpath
            ? metadata?.defaultpath.slice(1)
            : metadata?.filename;
          const file = subfiles[filepath] || {};

          if (/video/.test(file.contenttype)) {
            setHtmlProps(null);
            setYoutubeProps(null);
            setImageProps(null);
            VID_CACHE[link] = {
              videoUrl: link,
              title: file?.filename,
              description: '',
            };
            setVideoProps(VID_CACHE[link]);
            return;
          }

          if (/image/.test(file.contenttype)) {
            setHtmlProps(null);
            setYoutubeProps(null);
            setVideoProps(null);
            IMG_CACHE[link] = {
              title: file?.filename,
              description: '',
              imageUrl: link,
            };
            setImageProps(IMG_CACHE[link]);
            return;
          }

          HTML_CACHE[link] = {
            url: link,
            title: file?.filename,
            siteName: url.hostname,
            description: '',
            images: [],
            mediaType: '',
            contentType: file.contenttype,
            videos: [],
            favicons: [],
          };
          setHtmlProps(HTML_CACHE[link]);
          setYoutubeProps(null);
          setImageProps(null);
          setVideoProps(null);
          return;
        }

        if (URL_LOADING[link]) {
          return;
        }

        if (VID_CACHE[link]) {
          return setVideoProps(VID_CACHE[link]);
        }

        if (IMG_CACHE[link]) {
          return setImageProps(IMG_CACHE[link]);
        }

        if (HTML_CACHE[link]) {
          return setHtmlProps(HTML_CACHE[link]);
        }

        if (YT_CACHE[link]) {
          return setYoutubeProps(YT_CACHE[link]);
        }

        URL_LOADING[link] = true;
        const resp = await fetch(`${INDEXER_API}/preview?url=${encodeURI(link)}`);
        const json = await resp.json();

        if (json.siteName === 'YouTube') {
          const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
          const match = link.match(regExp);
          if (match && match[2].length == 11) {
            setHtmlProps(null);
            setImageProps(null);
            setVideoProps(null);
            YT_CACHE[link] = {
              title: json.title,
              description: json.description,
              videoId: match[2],
              images: json.images,
            };
            setYoutubeProps(YT_CACHE[link]);
            return;
          }
        }

        if (json.mediaType === 'video.other') {
          setHtmlProps(null);
          setYoutubeProps(null);
          setImageProps(null);

          VID_CACHE[link] = {
            videoUrl: json.videos[0]?.url,
            title: json.title,
            description: json.description,
            images: json.images,
          };
          setVideoProps(VID_CACHE[link]);
          return;
        }

        if (json.mediaType === 'video') {
          setHtmlProps(null);
          setYoutubeProps(null);
          setImageProps(null);

          VID_CACHE[link] = {
            videoUrl: json.url,
            title: json.contentType,
            siteName: url.host,
            images: [],
          };
          setVideoProps(VID_CACHE[link]);
          return;
        }

        if (json.mediaType === 'image') {
          setHtmlProps(null);
          setYoutubeProps(null);
          setVideoProps(null);
          IMG_CACHE[link] = {
            title: json.title,
            description: json.description,
            imageUrl: json.url,
          };
          setImageProps(IMG_CACHE[link]);
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
          HTML_CACHE[link] = {
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
          HTML_CACHE[link] = json;
          return;
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        URL_LOADING[link] = false;
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

  const images = htmlProps?.images || youtubeProps?.images || videoProps?.images;
  const image = images && images[0];

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
        htmlProps?.images && htmlProps?.images[0] && (
          <div
            className="link-preview__image"
            style={{
              backgroundImage: `url(${image})`,
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
                backgroundImage: `url(${image})`,
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
              height="fit-content"
              autoPlay
              controls
              loop
            />
          )
          : videoProps?.images && (
            <div
              className="link-preview__image"
              style={{
                backgroundImage: `url(${image})`,
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
            <img
              className="link-preview__image-wrapper__image"
              src={imageProps.imageUrl}
              // style={{backgroundImage: `url(${imageProps.imageUrl})`}}
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
