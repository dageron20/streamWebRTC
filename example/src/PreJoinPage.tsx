import { faBolt } from '@fortawesome/free-solid-svg-icons';
import { createLocalVideoTrack, LocalVideoTrack } from 'livekit-client';
import { AudioSelectButton, ControlButton, VideoSelectButton } from '@livekit/react-components';
import { VideoRenderer } from '@livekit/react-core';
import React, { ReactElement, useEffect, useState } from 'react';
import { AspectRatio } from 'react-aspect-ratio';
import { useNavigate } from 'react-router-dom';

const livekitApi = require('livekit-server-sdk');
const AccessToken = livekitApi.AccessToken;

export const PreJoinPage = () => {
  // initial state from query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const storedUrl = searchParams.get('url') ?? 'ws://localhost:7880';
  const storedToken = searchParams.get('token') ?? '';

  // state to pass onto room
  const [url, setUrl] = useState(storedUrl);
  const [token, setToken] = useState<string>(storedToken);
  const [simulcast, setSimulcast] = useState(true);
  const [dynacast, setDynacast] = useState(true);
  const [adaptiveStream, setAdaptiveStream] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  // disable connect button unless validated
  const [connectDisabled, setConnectDisabled] = useState(true);
  const [videoTrack, setVideoTrack] = useState<LocalVideoTrack>();
  const [audioDevice, setAudioDevice] = useState<MediaDeviceInfo>();
  const [videoDevice, setVideoDevice] = useState<MediaDeviceInfo>();
  const navigate = useNavigate();

  useEffect(() => {
    if (token && url) {
      setConnectDisabled(false);
    } else {
      setConnectDisabled(true);
    }
  }, [token, url]);

  const toggleVideo = async () => {
    if (videoTrack) {
      videoTrack.stop();
      setVideoEnabled(false);
      setVideoTrack(undefined);
    } else {
      const track = await createLocalVideoTrack({
        deviceId: videoDevice?.deviceId,
      });
      setVideoEnabled(true);
      setVideoTrack(track);
    }
  };

  useEffect(() => {
    // enable video by default
    createLocalVideoTrack({
      deviceId: videoDevice?.deviceId,
    }).then((track) => {
      setVideoEnabled(true);
      setVideoTrack(track);
    });
  }, [videoDevice]);

  const toggleAudio = () => {
    if (audioEnabled) {
      setAudioEnabled(false);
    } else {
      setAudioEnabled(true);
    }
  };

  const selectVideoDevice = (device: MediaDeviceInfo) => {
    setVideoDevice(device);
    if (videoTrack) {
      if (videoTrack.mediaStreamTrack.getSettings().deviceId === device.deviceId) {
        return;
      }
      // stop video
      videoTrack.stop();
    }
  };

  const connectToRoom = async () => {
    if (videoTrack) {
      videoTrack.stop();
    }

    if (
      window.location.protocol === 'https:' &&
      url.startsWith('ws://') &&
      !url.startsWith('ws://localhost')
    ) {
      alert('Unable to connect to insecure websocket from https');
      return;
    }

    const params: { [key: string]: string } = {
      url,
      token,
      videoEnabled: videoEnabled ? '1' : '0',
      audioEnabled: audioEnabled ? '1' : '0',
      simulcast: simulcast ? '1' : '0',
      dynacast: dynacast ? '1' : '0',
      adaptiveStream: adaptiveStream ? '1' : '0',
    };
    if (audioDevice) {
      params.audioDeviceId = audioDevice.deviceId;
    }
    if (videoDevice) {
      params.videoDeviceId = videoDevice.deviceId;
    } else if (videoTrack) {
      // pass along current device id to ensure camera device match
      const deviceId = await videoTrack.getDeviceId();
      if (deviceId) {
        params.videoDeviceId = deviceId;
      }
    }
    navigate({
      pathname: '/room',
      search: '?' + new URLSearchParams(params).toString(),
    });
  };

  let videoElement: ReactElement;
  if (videoTrack) {
    videoElement = <VideoRenderer track={videoTrack} isLocal={true} />;
  } else {
    videoElement = <div className="placeholder" />;
  }

  const [dropmenu, setdropmenu] = useState()
  const activeLeftMenu = () => {
    // @ts-ignore
    setdropmenu(!dropmenu);
  }

  const [isOpen, setIsOpen] = useState(true);

  let username = React.useRef<HTMLInputElement>(null);
  let roomName = React.useRef<HTMLInputElement>(null);

  function createJwtToken(username: any, RoomName: any) {
    const at = new AccessToken('api-key', 'secret-key', {
      identity: username,
    });
    at.addGrant({ roomJoin: true, room: RoomName });
    const token = 555;
    console.log('access token', token);
  }

  return (
    <div className="prejoin">
      <main>

        <div className="wrapper">
          <div className={`menu ${(dropmenu === true) && "menu_active"}`}>
            <a href="#" className={`menu-btn ${(dropmenu === true) && "menu_active"}`}  onClick={activeLeftMenu}>
              <div className={`arrow ${(dropmenu === true) && "arrow_active"}`}></div>
            </a>
            <nav className="menu-list">
              <div className="entrySection">
                <div>
                  <div className="label">FlowUnion URL</div>
                  <div>
                    <input type="text" name="url" value={url} onChange={(e) => setUrl(e.target.value)} />
                  </div>
                </div>
                <div>
                  <div className="label">Token</div>
                  <div>
                    <input
                      type="text"
                      name="token"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      autoFocus={true}
                    />
                  </div>
                </div>
                <div className="options">
                  <div>
                    <input
                      id="simulcast-option"
                      type="checkbox"
                      name="simulcast"
                      checked={simulcast}
                      onChange={(e) => setSimulcast(e.target.checked)}
                    />
                    <label htmlFor="simulcast-option">Simulcast</label>
                  </div>
                  <div>
                    <input
                      id="dynacast-option"
                      type="checkbox"
                      name="dynacast"
                      checked={dynacast}
                      onChange={(e) => setDynacast(e.target.checked)}
                    />
                    <label htmlFor="dynacast-option">Dynacast</label>
                  </div>
                  <div>
                    <input
                      id="adaptivestream-option"
                      type="checkbox"
                      name="adaptiveStream"
                      checked={adaptiveStream}
                      onChange={(e) => setAdaptiveStream(e.target.checked)}
                    />
                    <label htmlFor="adaptivestream-option">Adaptive Stream</label>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </div>

        <h1>FlowUnion</h1>

        <a onClick={() => {if(isOpen === false ) setIsOpen(true); else setIsOpen(false)}}>
          <div className="ArtemNice">Login</div>
        </a>
        <div>
          {isOpen ?
            <div className="configuration">
              <div className="configuration-settings-window">
                <div className="config1">
                  <span>Your name</span>
                  <input type="text" placeholder="Enter your name" ref={username} />
                  <span>Room name</span>
                  <input type="text" placeholder="Enter the name of the room" ref={roomName}/>
                </div>
                <div className="config2">
                  <button onClick={ () => createJwtToken}>Create a Room</button>
                  <button>Enter the room</button>
                </div>

              </div>
            </div>
            :
            <div></div>
          }
        </div>

        <div className="videoSection">
          <AspectRatio ratio={16 / 9}>{videoElement}</AspectRatio>
        </div>

        <div className="controlSection">
          <div className="video-audio">
            <AudioSelectButton
              isMuted={!audioEnabled}
              onClick={toggleAudio}
              onSourceSelected={setAudioDevice}
            />
            <VideoSelectButton
              isEnabled={videoTrack !== undefined}
              onClick={toggleVideo}
              onSourceSelected={selectVideoDevice}
            />
          </div>
          <div className="right">
            <ControlButton
              label="Connect"
              disabled={connectDisabled}
              icon={faBolt}
              onClick={connectToRoom}
            />
          </div>
        </div>
      </main>
      <footer>

      </footer>
    </div>
  );
};
