/**
 * @author Fingers
 * @description 鹰眼控件
 * @param {Object} options 
 */
function miniMapControl(options) { 
    this.options = options
    this._ticking = false
	this._lastMouseMoveEvent = null
	this._parentMap = null
	this._isDragging = false
	this._isCursorOverFeature = false
	this._previousPoint = [0, 0]
	this._currentPoint = [0, 0]
    this._trackingRectCoordinates = [[[], [], [], [], []]];
    this.lineColor = '#f17c67'
    this.lineWidth = 2
    this.lineOpacity = 1
    this.fillColor = "#eb3f2f"
    this.fillOpacity = 0.5
    if(this.options.lineWidth){
        this.lineWidth = this.options.lineWidth
    }
    if(this.options.lineColor){
        this.lineColor = this.options.lineColor
    }
    if(this.options.lineOpacity){
        this.lineOpacity = this.options.lineOpacity
    }
    if(this.options.fillColor){
        this.fillColor = this.options.fillColor
    }
    if(this.options.fillOpacity){
        this.fillOpacity = this.options.fillOpacity
    }
}
miniMapControl.prototype.addTo = function(map) {
    this._map = map;
    var opts = this.options;
    this._container = document.createElement("div");

    this._container.id = "mapboxgl-ctrl-minimap";
    var pos = opts.position.split("-")
    this._container.setAttribute('style', 'position:absolute;width: ' + opts.width + '; height: ' + opts.height + ';' + pos[0] + ': 0;' + pos[1] + ': 0;');

    map.getContainer().appendChild(this._container);
    var miniMap = this._miniMap = new mapboxgl.Map({
        attributionControl: false,
        container: this._container,
        style: { // stylesheet location
            "version": 8,
            "sources": {},
            "layers": []
        },
        zoom: this._map.getZoom(),
        center: this._map.getCenter()
    });
    miniMap.on('load', _load.bind(this))
};
miniMapControl.prototype.remove = function () {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
    this._miniMap = undefined
};
function _load(){

    var opts = this.options;
    var map = this._map;
    var miniMap = this._miniMap;
    var interactions = [
        "dragPan", "scrollZoom", "boxZoom", "dragRotate",
        "keyboard", "doubleClickZoom", "touchZoomRotate"
    ];
    var minimap_layer = {
        "id": "minimap_layer",
        "type": "raster",
        "source": {
            "type": "raster",
            "tiles": [opts.layer],
            "zoomOffset": 0,
            "tileSize": 256
        }
    };
    miniMap.addLayer(minimap_layer);
    
    interactions.forEach(function(i){
        if( opts[i] !== true ) {
            miniMap[i].disable();
        }
    });
    if( opts.bounds === "parent" ) {
        opts.bounds = map.getBounds();
        _convertBoundsToPoints(this,opts.bounds)
    }

    if( typeof opts.bounds === "object" ) {
        miniMap.fitBounds(opts.bounds, {duration: 50});
    }
    // * 加载鹰眼地图数据源
    miniMap.addSource("miniBound", {
        "type": "geojson",
        "data": {
            "type": "Feature",
            "properties": {
                "name": "miniBound"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": this._trackingRectCoordinates
            }
        }
    });
    // * 添加地图边界外边线图层
    miniMap.addLayer({
        "id": "miniBoundOutline",
        "type": "line",
        "source": "miniBound",
        "layout": {},
        "paint": {
            "line-color": this.lineColor,
            "line-width": this.lineWidth,
            "line-opacity": this.lineOpacity
        }
    });
    // * 添加地图边界外边面图层
    miniMap.addLayer({
        "id": "miniBoundFill",
        "type": "fill",
        "source": "miniBound",
        "layout": {},
        "paint": {
            "fill-color": this.fillColor,
            "fill-opacity": this.fillOpacity
        }
    });
    // * 保留minimap数据源
    this._trackingRect = miniMap.getSource("miniBound");
    // * 初始化zoom以及bounds
    var initZoom = _zoomAdjust.bind(this)
    var initUpdate = _update.bind(this)
    initZoom()
    initUpdate()
    // * 事件同步
    map.on("move", _update.bind(this));
    map.on("zoom", _zoomAdjust.bind(this));
    map.on('drag',_zoomAdjust.bind(this))
    miniMap.on("mousemove", _mouseMove.bind(this));
    miniMap.on("mousedown", _mouseDown.bind(this));
    miniMap.on("mouseup", _mouseUp.bind(this));

    this._miniMapCanvas = miniMap.getCanvasContainer();
}
// * 将边界数据变为geometry点数据
function _convertBoundsToPoints(_t, bounds ){
    var ne = bounds._ne;
    var sw = bounds._sw;
    var trc = _t._trackingRectCoordinates;

    trc[0][0][0] = ne.lng;
    trc[0][0][1] = ne.lat;
    trc[0][1][0] = sw.lng;
    trc[0][1][1] = ne.lat;
    trc[0][2][0] = sw.lng;
    trc[0][2][1] = sw.lat;
    trc[0][3][0] = ne.lng;
    trc[0][3][1] = sw.lat;
    trc[0][4][0] = ne.lng;
    trc[0][4][1] = ne.lat;
}
// * 偏移检测
function inspectBounds(bounds,offset){
    var newOffset = offset
    if(bounds._ne.lat - offset[1] > 90){
        newOffset[1] = 90 - bounds._ne.lat
    }
    if(bounds._sw.lat - offset[1] < -90){
        newOffset[1] = -90 + bounds._sw.lat
    }
    // if(bounds._ne.lng - offset[0] > 180){
    //     newOffset[0] = 180 - bounds._ne.lng
    // }
    // if(bounds._sw.lng - offset[0] < -180){
    //     newOffset[0] = -180 + bounds._sw.lng
    // }
    return newOffset
}
// * 地图移动更新边界数据源
function _moveTrackingRect(_t,offset){
    var source = _t._trackingRect;
    var data = source._data;
    var bounds = data.properties.bounds;
    // 检测偏移
    var inspectedOffset = inspectBounds(bounds,offset)

    bounds._ne.lat -= inspectedOffset[1];
    bounds._ne.lng -= inspectedOffset[0];
    bounds._sw.lat -= inspectedOffset[1];
    bounds._sw.lng -= inspectedOffset[0];
    
    _convertBoundsToPoints(_t,bounds);
    source.setData(data);

    return bounds;
}
// * 设置边界数据
function _setTrackingRectBounds(_t, bounds ){
    var source = _t._trackingRect;
    var data = source._data;

    data.properties.bounds = bounds;
    _convertBoundsToPoints(_t,bounds);
    source.setData(data);
}
// * 更新minimap地图状态
function _update(){
    if(!this._miniMap){
        return
    }
    if( this._isDragging  ) {
        return;
    }
    var parentBounds = this._map.getBounds();
    _setTrackingRectBounds(this,parentBounds);
}
// * 鼠标移动执行事件
function _mouseMove(e){
    if(!this._miniMap){
        return
    }
    this._ticking = false;

    var miniMap = this._miniMap;
    var features = miniMap.queryRenderedFeatures(e.point,{
        layers: ["miniBoundFill"]
    });

    // * 当悬浮在范围上时，不做拖动操作
    if( ! (this._isCursorOverFeature && features.length > 0) )
    {
        this._isCursorOverFeature = features.length > 0;
        this._miniMapCanvas.style.cursor = this._isCursorOverFeature ? "move" : "";
    }

    if( this._isDragging )
    {   
        this._previousPoint = this._currentPoint;
        this._currentPoint = [e.lngLat.lng, e.lngLat.lat];

        var offset = [
            this._previousPoint[0] - this._currentPoint[0],
            this._previousPoint[1] - this._currentPoint[1]
        ];

        var newBounds = _moveTrackingRect(this,offset);

        this._map.fitBounds(newBounds, {
            duration: 500,
            noMoveStart: false
        });
    }
}
function _mouseDown( e ){
    if(!this._miniMap){
        return
    }
    if( this._isCursorOverFeature )
    {
        this._isDragging = true;
        this._previousPoint = this._currentPoint;
        this._currentPoint = [e.lngLat.lng, e.lngLat.lat];
    }
}
function _mouseUp (){
    if(!this._miniMap){
        return
    }
    this._isDragging = false;
    this._ticking = false;
}
// * zoom适应
function _zoomAdjust (){
    if(!this._miniMap){
        return
    }
    var miniMap = this._miniMap;
    var map = this._map;
    var parentZoom = parseInt(map.getZoom());
    var levels = this.options.zoomLevels;
    var zoom 
    miniMap.setCenter(map.getCenter())
    if(parentZoom - levels >= 0){
        zoom = parentZoom - levels
    }else{
        zoom = 0
    }
    miniMap.zoomTo(zoom)
}