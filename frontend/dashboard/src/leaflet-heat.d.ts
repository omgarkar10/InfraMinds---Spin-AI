import * as L from 'leaflet';

declare module "leaflet.heat/dist/leaflet-heat.js";

declare module 'leaflet' {
    interface HeatLayerOptions {
        minOpacity?: number;
        maxZoom?: number;
        max?: number;
        radius?: number;
        blur?: number;
        gradient?: { [key: number]: string };
    }

    interface HeatLayer extends L.Layer {
        setOptions(options: HeatLayerOptions): this;
        addLatLng(latlng: L.LatLng | L.LatLngTuple | L.LatLngLiteral): this;
        setLatLngs(latlngs: Array<L.LatLng | L.LatLngTuple | L.LatLngLiteral | [number, number, number]>): this;
        redraw(): this;
    }

    function heatLayer(
        latlngs: Array<L.LatLng | L.LatLngTuple | L.LatLngLiteral | [number, number, number]>,
        options?: HeatLayerOptions
    ): HeatLayer;
}
