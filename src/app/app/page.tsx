'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GPXUploader from '@/components/GPXUploader';
import StravaActivities from '@/components/StravaActivities';
import MapViewer from '@/components/MapViewer';
import DesignConfigurator from '@/components/DesignConfigurator';

export default function GPXDesignApp() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'map' | 'design'>('upload');
  const [gpxData, setGpxData] = useState<any>(null);
  const [processedGpxData, setProcessedGpxData] = useState<any>(null);
  const [boundingBox, setBoundingBox] = useState<string>('');
  const [designConfig, setDesignConfig] = useState({
    routeColor: '#2563eb',
    printType: 'tile' as 'tile' | 'ornament',
    tileSize: 'ridgeline' as 'basecamp' | 'ridgeline' | 'summit',
    labels: [] as Array<{
      text: string;
      x: number;
      y: number;
      size: number;
      rotation: number;
      width: number;
      height: number;
      fontFamily: 'Garamond' | 'Poppins' | 'Trispace';
      textAlign: 'left' | 'center' | 'right';
      bold: boolean;
      italic: boolean;
    }>,
    ornamentLabels: [] as Array<{
      text: string;
      angle: number; // Position around circle in degrees (0 = top)
      radius: number; // Distance from center
      size: number;
      fontFamily: 'Garamond' | 'Poppins' | 'Trispace';
      bold: boolean;
      italic: boolean;
    }>,
    ornamentCircle: {
      x: 200,
      y: 200,
      radius: 160,
    },
  });
  const [stravaAccessToken, setStravaAccessToken] = useState<string | null>(null);
  const [showGpxUploader, setShowGpxUploader] = useState(false);

  useEffect(() => {
    const refreshToken = localStorage.getItem('strava_refresh_token');
    const accessToken = localStorage.getItem('strava_access_token');
    const expiresAt = localStorage.getItem('strava_expires_at');

    const handleTokenRefresh = async () => {
      if (refreshToken) {
        try {
          const response = await fetch('/api/strava/refresh', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          const data = await response.json();
          if (data.access_token) {
            localStorage.setItem('strava_access_token', data.access_token);
            localStorage.setItem('strava_refresh_token', data.refresh_token);
            localStorage.setItem('strava_expires_at', data.expires_at);
            setStravaAccessToken(data.access_token);
          } else {
            throw new Error('Failed to refresh token');
          }
        } catch (error) {
          console.error('Error refreshing token:', error);
          localStorage.removeItem('strava_access_token');
          localStorage.removeItem('strava_refresh_token');
          localStorage.removeItem('strava_expires_at');
        }
      }
    };

    if (accessToken && expiresAt) {
      if (Date.now() / 1000 > parseInt(expiresAt)) {
        // Token expired
        handleTokenRefresh();
      } else {
        setStravaAccessToken(accessToken);
      }
    } else if (refreshToken) {
      handleTokenRefresh();
    }
  }, []);

  useEffect(() => {
    if (gpxData && gpxData.gpx) {
      const points = gpxData.gpx.trk.trkseg.trkpt.map((p: any) => ({
        lat: p["@_lat"],
        lon: p["@_lon"],
      }));

      const bounds = points.reduce(
        (acc: any, p: any) => ({
          minLat: Math.min(acc.minLat, p.lat),
          minLon: Math.min(acc.minLon, p.lon),
          maxLat: Math.max(acc.maxLat, p.lat),
          maxLon: Math.max(acc.maxLon, p.lon),
        }),
        {
          minLat: Infinity,
          minLon: Infinity,
          maxLat: -Infinity,
          maxLon: -Infinity,
        }
      );

      setProcessedGpxData({ ...gpxData, points, bounds });
    } else if (gpxData) {
      // Handle GPX files that are already processed
      setProcessedGpxData(gpxData);
    }
  }, [gpxData]);

  const handleGPXUpload = (parsedGPX: any) => {
    setGpxData(parsedGPX);
    if (parsedGPX) {
      setCurrentStep('map');
    } else {
      setCurrentStep('upload');
    }
  };

  const handleBoundingBoxConfirm = (bbox: string) => {
    setBoundingBox(bbox);
    setCurrentStep('design');
  };

  const handleRestart = () => {
    setCurrentStep('upload');
    setGpxData(null);
    setBoundingBox('');
    setDesignConfig({
      routeColor: '#2563eb',
      printType: 'tile',
      tileSize: 'ridgeline',
      labels: [],
      ornamentLabels: [],
      ornamentCircle: {
        x: 200,
        y: 200,
        radius: 160,
      },
    });
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-alpine-mist">
        {/* Hero Section */}
        <div className="bg-alpine-mist py-8 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-headline font-bold text-basalt sm:text-5xl lg:text-6xl">
                Design Your{' '}
                <span className="text-gradient-adventure">Route Print</span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-storm">
                Upload your GPX file, select the perfect area, and customize your 3D print design
              </p>

              {/* Progress Indicator */}
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-4">
                  <div
                    onClick={() => setCurrentStep('upload')}
                    className={`flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity ${currentStep === 'upload' ? 'text-summit-sage' : currentStep === 'map' || currentStep === 'design' ? 'text-basalt' : 'text-slate-storm/50'}`}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'upload' ? 'bg-summit-sage text-white' : currentStep === 'map' || currentStep === 'design' ? 'bg-basalt text-white' : 'bg-slate-storm/20 text-slate-storm/50'}`}>
                      1
                    </div>
                    <span className="text-sm font-semibold">Upload</span>
                  </div>
                  <div className={`w-8 h-px ${currentStep === 'map' || currentStep === 'design' ? 'bg-basalt' : 'bg-slate-storm/20'}`}></div>
                  <div
                    onClick={() => gpxData && setCurrentStep('map')}
                    className={`flex items-center space-x-2 transition-opacity ${gpxData ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'} ${currentStep === 'map' ? 'text-summit-sage' : currentStep === 'design' ? 'text-basalt' : 'text-slate-storm/50'}`}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'map' ? 'bg-summit-sage text-white' : currentStep === 'design' ? 'bg-basalt text-white' : 'bg-slate-storm/20 text-slate-storm/50'}`}>
                      2
                    </div>
                    <span className="text-sm font-semibold">Select Area</span>
                  </div>
                  <div className={`w-8 h-px ${currentStep === 'design' ? 'bg-basalt' : 'bg-slate-storm/20'}`}></div>
                  <div
                    onClick={() => gpxData && boundingBox && setCurrentStep('design')}
                    className={`flex items-center space-x-2 transition-opacity ${gpxData && boundingBox ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'} ${currentStep === 'design' ? 'text-summit-sage' : 'text-slate-storm/50'}`}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'design' ? 'bg-summit-sage text-white' : 'bg-slate-storm/20 text-slate-storm/50'}`}>
                      3
                    </div>
                    <span className="text-sm font-semibold">Design</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* App Content */}
        <div className="py-8 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Step Content */}
            {currentStep === 'upload' && (
              <div className="max-w-2xl mx-auto">
                {stravaAccessToken && !showGpxUploader ? (
                  <>
                    <StravaActivities accessToken={stravaAccessToken} onActivitySelect={handleGPXUpload} />
                    <div className="mt-8 text-center">
                      <button onClick={() => setShowGpxUploader(true)} className="text-sm text-slate-storm hover:text-basalt">
                        Or upload a GPX file manually
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <GPXUploader onGPXUpload={handleGPXUpload} />
                    {stravaAccessToken && (
                      <div className="mt-8 text-center">
                        <button onClick={() => setShowGpxUploader(false)} className="text-sm text-slate-storm hover:text-basalt">
                          Back to Strava Activities
                        </button>
                      </div>
                    )}
                    {!stravaAccessToken && (
                      <div className="mt-8 text-center">
                        <p className="text-slate-storm mb-4">Or</p>
                        <a href="/strava">
                          <img src="/btn_strava_connect_with_orange.svg" alt="Connect with Strava" className="mx-auto" />
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {currentStep === 'map' && processedGpxData && (
              <MapViewer
                gpxData={processedGpxData}
                onBoundingBoxChange={setBoundingBox}
                boundingBox={boundingBox}
                onConfirmSelection={() => handleBoundingBoxConfirm(boundingBox)}
                onRestart={handleRestart}
              />
            )}

            {currentStep === 'design' && processedGpxData && boundingBox && (
              <DesignConfigurator
                gpxData={processedGpxData}
                boundingBox={boundingBox}
                designConfig={designConfig}
                onConfigChange={setDesignConfig}
                onRestart={handleRestart}
              />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}