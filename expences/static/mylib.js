// -*- encoding:utf-8-*-

function ajaxRequest(method,url,processor,params) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
            if (xmlhttp.status == 200) {
		processor(xmlhttp.responseText);
	    }
            else {
		console.log('something else other than 200 was returned.'+xmlhttp.status );
            }
        }
    };
    xmlhttp.open(method, url, true);
    if (method=='POST'){
	xmlhttp.setRequestHeader("X-CSRFToken", getCookie("csrftoken"));
    }
    xmlhttp.send(params);
}
function getCookie(name){
    let h={};
    let cookie=document.cookie.split('; ').map((item)=>{
	let pair=item.split('=');
	h[pair[0]]=pair[1];
	return pair; });
    return h[name];
}

function formatDate(d){
    return d.getFullYear()+'-'+('00'+(d.getMonth()+1)).slice(-2)+'-'+('00'+d.getDate()).slice(-2);
}

//My VegaChart-with-interaction lib
function makeVegaSpecs(){
    let barbase={"$schema": "https://vega.github.io/schema/vega/v4.json",
		 "width": 400,
		 "height": 300,
		 "autosize": "fit",
		 "legends":[{fill:"color"}]};
    let barscales=[{name: "date", type: "band", range: "width", domain: {data: "table", field: "day"}},
		   {name: "money", type: "linear",range: "height",nice: true, zero: true,domain: {"data": "table", "field": "s1"}},
		   {name: "color", type: "ordinal", range: {scheme: "category20"}, domain: {data: "table", field: "cat"}
		   }];
    let baraxes=[{"orient": "bottom", "scale": "date", "zindex": 1, "labelAngle":-90,"labelAlign":"right"},
		 {"orient": "left", "scale": "money", "zindex": 1, "grid":true,"tickCount": 5}
		];
    let barmarks=[{"type": "rect",
		   "from": {"data": "table"},
		   "encode": {
		       "enter": {
			   "x": {"scale": "date", "field": "day"},
			   "width": {"scale": "date", "band": 1, "offset": -1},
			   "y": {"scale": "money", "field": "s0"},
			   "y2": {"scale": "money", "field": "s1"},
			   "fill": {"scale": "color", "field": "cat"}
		       },
		       "update": {"fillOpacity": {"value": 1}},
		       "hover": {"fillOpacity": {"value": 0.5}}
		   }}];
    let bardatatransform= [{"name": "table",
			    "transform": [{"type": "stack",
				   "groupby": ["day"],
				   "sort": {"field": "cat"},
				   "as" : ["s0","s1"],
				   "field": "summ"
				  }]
			   }];

    let piebase={
	    "$schema": "https://vega.github.io/schema/vega/v4.json",
	    "width": 300,
	    "height": 150,
	    "autosize": "fit",
	    "data": [
		{
		    "name": "table",
		    "transform": [
			{"type":"aggregate",
			 "groupby": ["cat"],
			 "fields":["summ"],
			 "ops":["sum"],
			 "as":["sum"]
			},
			{
			    "type": "pie",
			    "field": "sum"
			}
		    ]
		}
	    ],
	    "scales": [
		{
		    "name": "color",
		    "type": "ordinal",
		    "domain": {"data": "table", "field": "cat"},
		    "range": {"scheme": "category20"}
		}
	    ],
	    "legends":[
		{fill:"color"}
	    ],
	    "marks": [
		{
		    "type": "arc",
		    "from": {"data": "table"},
		    "encode": {
			"enter": {
			    "fill": {"scale": "color", "field": "cat"},
			    "x": {"signal": "width / 2"},
			    "y": {"signal": "height / 2"}
			},
			"update": {
			    "startAngle": {"field": "startAngle"},
			    "endAngle": {"field": "endAngle"},
			    "outerRadius": {"signal": "height / 2"},
			    "fillOpacity": {"value": 1}
			},
			"hover": {"fillOpacity": {"value": 0.5}
			}	   
		    } 
		},
	    ]
    }

    let gaugebase={
	"$schema": "https://vega.github.io/schema/vega/v4.json",
	"width": 400,
	"height": 200,
	"autosize": "fit",
	"data": [{"name": "table",
		 }],
	scales: [{name: "date", type: "point", range: "width", domain: {data: "table", field: "day"}},
		 {name: "money", type: "linear",range: "height",nice: true, zero: true,domain: {"data": "table", "field": "summ"}},
		 {name: "color", type: "ordinal", range: {scheme: "category20"}, domain: {data: "table", field: "cat"}}
		 ],
	axes:baraxes.slice(0),
	"legends":[{fill:"color"}],
	"marks": [
	    {
		"type": "group",
		"from": {
		    "facet": {
			"name": "series",
			"data": "table",
			"groupby": "cat"
		    }
		},
		"marks": [{"type": "line",
			   "from": {"data": "series"},
			   "encode": {
			       "enter": {
				   "x": {"scale": "date", "field": "day"},
				   "y": {"scale": "money", "field": "summ"},
				   "stroke": {"scale": "color", "field": "cat"},
				   "strokeWidth": {"value": 2},
				   //"interpolate":{"value": "natural"}
				   //"interpolate":{"value": "step"}
			       },
			       "update": {
				   "fillOpacity": {"value": 1}
			       },
			       "hover": {
				   "fillOpacity": {"value": 0.5}
			       }
			   }
			  }
			 ]
	    }
	]
    };
    let barspec=makeVegaSpec(barbase,baraxes,barscales,barmarks,bardatatransform);
    let piespec=makeVegaSpec(piebase);
    let gaugespec=makeVegaSpec(gaugebase);
    return {bar:barspec, pie:piespec, gauge:gaugespec};
}

function makeVegaSpec(base,axes,scales,marks,datatransform){
    let ret=Object.assign({},base);
    if (axes) ret.axes=axes;
    if (scales) ret.scales=scales;
    if (marks) ret.marks=marks;
    if (datatransform) ret.data=datatransform;
    return function(datavalues,title){
//	console.log('binding:');
//	console.log(datavalues);
	ret.data[0].values=datavalues;
	ret.title=title
	return ret;
    }
}
