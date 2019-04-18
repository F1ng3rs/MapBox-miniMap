# miniMapControl.js  鹰眼控件

##### 说明：鹰眼控件就是一个缩略地图，上面有一个矩形框，矩形框区域就是当前显示的地图区域，拖动矩形框可以改变当前地图显示的位置，从起到导航的作用。鹰眼是地图浏览中常用的功能之一。

##### 使用方法：

```javascript
var miniMap = new miniMapControl({             					   							layer:'http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer/WMTS?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ChinaOnlineCommunity&STYLE=default&TILEMATRIXSET=default028mm&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png', //(必选)给定控件的底图
                width:  '300px',    //（必选）给定控件的宽
                height: '200px',    //（必选）给定控件的高
                position:"bottom-right",    //（必选）控件位置,有'top-left','top-right','bottom-left','bottom-right'可选
                bounds: 'parent',   //（必选）给定控件的显示边界，默认parent为map的范围边界，或提供bounds的对象值{_ne:{lng:111,lat:30},_sw:{{lng:111,lat:30}}}
                zoomLevels: 4,      //（必选）鹰眼地图与当前地图的zoom差
                lineColor: '#f17c67',   //（可选）鹰眼控件边界范围的线颜色，默认'#f17c67'
                lineWidth : 2,  //（可选）鹰眼控件边界范围的线宽，默认为2
                lineOpacity : 1,    //（可选）鹰眼控件边界范围的线透明度，默认为1
                fillColor :"#eb3f2f",   //（可选）鹰眼控件边界范围的面颜色，默认为"#eb3f2f"
                fillOpacity : 0.5   //（可选）鹰眼控件边界范围的面透明度，默认为0.5
            })
            miniMap.addTo(map)
			//miniMap.remove()
```

##### 接口：

`miniMap.addTo(map)`： 将控件加载到地图，这个map必须是mapbox-gl的map

`miniMap.remove()`：将控件从地图上移除