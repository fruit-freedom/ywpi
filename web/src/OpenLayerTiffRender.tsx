import React, { useEffect, useState } from 'react'

// import debounce from 'debounce'

import Map from 'ol/Map'
import { Tile, Vector, VectorImage } from 'ol/layer';
import { XYZ, Vector as SourceVector, OSM } from 'ol/source';
import View from 'ol/View';
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Stroke, Fill, Circle } from 'ol/style';
import { Modify, Draw, Snap, Select, defaults, DragPan, MouseWheelZoom } from 'ol/interaction'
import MultiPoint from 'ol/geom/MultiPoint';
import Projection from 'ol/proj/Projection';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
// import geojsonvt from 'geojson-vt';

// import geoJSONObject from './geoJSONObject'

const replacer = function (key, value) {
    if (!value || !value.geometry) {
        return value;
    }

    let type;
    const rawType = value.type;
    let geometry = value.geometry;
    if (rawType === 1) {
        type = 'MultiPoint';
        if (geometry.length == 1) {
            type = 'Point';
            geometry = geometry[0];
        }
    } else if (rawType === 2) {
        type = 'MultiLineString';
        if (geometry.length == 1) {
            type = 'LineString';
            geometry = geometry[0];
        }
    } else if (rawType === 3) {
        type = 'Polygon';
        if (geometry.length > 1) {
            type = 'MultiPolygon';
            geometry = [geometry];
        }
    }

    return {
        'type': 'Feature',
        'geometry': {
            'type': type,
            'coordinates': geometry,
        },
        'properties': value.tags,
    };
};

const loadGeoJSONLayer2 = async (mapInstance, url, color='rgba(255, 255, 0, 0.5)') => {
    const response = await fetch(url);
    const json = await response.json();

    mapInstance.addLayer(
        new VectorImage({
            source: new SourceVector({
                features: new GeoJSON().readFeatures(json, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                }),
            }),
            style: [
                new Style({
                    fill: new Fill({ color }),
                })
            ]
        })
    );
};

// const loadGeoJSONLayer = async (mapInstance, url, color='rgba(255, 255, 0, 0.5)') => {
//     // const url = 'https://openlayers.org/data/vector/ecoregions.json';
//     const response = await fetch(url);
//     const json = await response.json();

//     const tileIndex = geojsonvt(json, {
//         extent: 4096,
//         maxZoom: 24
//     });
//     const format = new GeoJSON({
//         // Data returned from geojson-vt is in tile pixel units
//         dataProjection: new Projection({
//             code: 'TILE_PIXELS',
//             units: 'tile-pixels',
//             extent: [0, 0, 4096, 4096],
//             featureProjection: 'EPSG:3857'
//         }),
//     });

//     const vectorSource = new VectorTileSource({
//         tileUrlFunction: function (tileCoord) {
//         // Use the tile coordinate as a pseudo URL for caching purposes
//             return JSON.stringify(tileCoord);
//         },
//         tileLoadFunction: function (tile, url) {
//             const tileCoord = JSON.parse(url);
//             const data = tileIndex.getTile(
//                 tileCoord[0],
//                 tileCoord[1],
//                 tileCoord[2],
//             );
//             const geojson = JSON.stringify(
//                 {
//                     type: 'FeatureCollection',
//                     features: data ? data.features : [],
//                 },
//                 replacer,
//             );
//             const features = format.readFeatures(geojson, {
//                 extent: vectorSource.getTileGrid().getTileCoordExtent(tileCoord),
//                 featureProjection: mapInstance.getView().getProjection(),
//             });
//             tile.setFeatures(features);
//         },
//     });
    
//     const layer = new VectorTileLayer({
//         style: [
//             new Style({
//                 fill: new Fill({ color }),
//             })
//         ],
//         minZoom: 3,
//         maxZoom: 1000,
//         source: vectorSource,
//         preload: Infinity
//     });

//     mapInstance.addLayer(layer);
// };

export default ({ viewCenter, xyzSource, extent }) => {
    const [mapInstance, setMapInstance] = useState(null);
    const [elementId, setElementId] = useState(null);

    useEffect(() => {
        if (!elementId)
            return;

        // DOM element should exists while before creating map
        // So, generate id in one another useEffect
        const map = new Map({
            target: elementId,
            layers: [
                new Tile({
                    source: new OSM(),
                }),
                new Tile({
                    extent: extent,
                    preload: Infinity,
                    source: new XYZ(xyzSource),
                }),
            ],
            view: new View({
                center: viewCenter,
                zoom: 16,
                minZoom: 3,
                maxZoom: 21
            }),
        });
        setMapInstance(map);
        
        return () => map.dispose();
    }, [elementId]);

    useEffect(() => {
        setElementId(`map${Math.floor(Math.random() * 1000000)}`);
    }, []);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {
                elementId ?
                <div style={{ height: '40vh', width: '60vw' }} id={elementId}></div>
                : null
            }
        </div>
    )
};