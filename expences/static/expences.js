// -*- encoding:utf-8-*-
//to onload. fill lists and default values. check record id in request. 
function load(){
    ajaxRequest('GET','/exp/init',function(a,b,c){loadHandler(a,b,c)});
}

function formatDate(d){
    return d.getFullYear()+'-'+('00'+(d.getMonth()+1)).slice(-2)+'-'+('00'+d.getDate()).slice(-2);
}

function loadHandler(respdata,textStatus,jqXHR){
    let data=JSON.parse(respdata);
    let dateto=formatDate(new Date());
    let datefrom=formatDate(new Date(Date.now()-86400000));
    let area=ReactDOM.render(React.createElement(Area, { data:null,lists:data.lists,settings:data.settings,fields:data.fields, dateto:dateto, datefrom:datefrom, name: 'Expences' }),document.getElementById('area'));
    area.requestTable();
}

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

class EditForm extends React.Component{
    constructor(props) {
	super(props);
	if (props.data)
	    this.state = Object.assign({},props.data);
	else{
	    this.state = {}
	    props.fields.forEach((f)=>{this.state[f]=''});
	    let d=new Date();
	    this.state['exptime']=d.getFullYear()+'-'+('00'+(d.getMonth()+1)).slice(-2)+'-'+('00'+d.getDate()).slice(-2);
	}
	//console.log(this.state);
	if (props.settings){
	    this.state['is_expence']=true;
	    this.state['is_approx']=false;
	    for (let i=0;i<props.lists.length;i++){
		this.state[props.lists[i].name]=props.settings[props.lists[i].name];
	    }
	}
	this.handleChange = this.handleChange.bind(this);
	this.handleSubmit = this.handleSubmit.bind(this);
    }
    handleChange(event) {
	if (event.target.name!='id')
	    this.setState({[event.target.name]: event.target.value});
    }
    handleCheckbox(event) {
	    this.setState({[event.target.name]: event.target.checked});
    }
    handleSubmit(event) {
	event.preventDefault();
	this.props.saveClick(this.state);
    }
    render(){
	var res=[];
	let fields = this.props.fields;
	let lists={};
	for (let i=0;i<this.props.lists.length;i++){
	    lists[this.props.lists[i].name]=this.props.lists[i].values;
	}
	for (let i = 0; i < fields.length; i++) {
	    let field = null;
	    if (Object.keys(lists).indexOf(fields[i])!=-1){
		let options=[];
		for (let j=0;j<lists[fields[i]].length;j++){
		    options.push(React.createElement('option',{key:lists[fields[i]][j]},lists[fields[i]][j]));
		}
		field =  React.createElement('select',{name: fields[i], type:'text', value:this.state[fields[i]], onChange:this.handleChange},options)
	    }
	    else 
	    {
		if (fields[i].substr(0,3)=='is_')
		    field =  React.createElement('input',{name: fields[i], type:'checkbox', checked:this.state[fields[i]], onChange:(e)=>this.handleCheckbox(e)})
		else{
		    let fieldtype=(fields[i]=='exptime')?'date':'text';	
		    field =  React.createElement('input',{name: fields[i], type:fieldtype, value:this.state[fields[i]], onChange:this.handleChange,'data-date-format':"YYYY-DD-MM"})
		}
	    }
            res.push(React.createElement('tr', { name: fields[i], key: fields[i] },
					 React.createElement('td',{name: fields[i]}, fields[i]),
					 React.createElement('td',{name: fields[i]}, field)
					)
		    );
        }
	let save= React.createElement('input',{name:'save', type:'submit',value:'save'});
	let cancel= React.createElement('input',{name:'cancel', type:'button', onClick:()=>this.props.cancelClick(),value:'close'});
	let quickbar=[]
	let quick_cats=this.props.quick_cats;
	//for (let i=0;i<quick_cats.length;i++)
	//    quickbar.push(React.createElement('input',{type:'image', className='quickbutton', background:'static/img/'+quick_cats[i], onClick:()=>{this.setState(category:quick_cats[i])}, alt=quick_cats[i]}));
	return React.createElement('form',{id:'editform',name:'editform',onSubmit:(e)=>this.handleSubmit(e)},
				   React.createElement('table',{},React.createElement('tbody',{},res)),
				   quickbar,
				   save,cancel);
    }
}

function TableView(props){
    let hres=[];
    let data=props.data;
    if (data==null || data.length<1)
	return React.createElement('p',{},'data is null =(');
    let keys=Object.keys(data[Object.keys(data)[0]]);
	for (let i=0;i< keys.length;i++){
	    hres.push(React.createElement('td', { name: keys[i], key: keys[i] }, keys[i]));
        }
    let headlines=React.createElement('tr',{},hres);
    let datalines=[];
    let ids=Object.keys(data)
    for (let i = 0; i < ids.length; i++) {
        datalines.push(
	    React.createElement(Tableline, {num:i, key:ids[i], data:data[ids[i]], editClick:(i)=>{props.editClick(i)}, delClick:(i)=>props.delClick(i)})
	);
	
    }
    let thead=React.createElement('thead', null, headlines);
    let tbody=React.createElement('tbody', {}, datalines);
    return (React.createElement('table', { name: 'table' },
				thead,
    				tbody,
			       ));
}
function Tableline(props){
    var res = [];
    var data = props.data;
    var keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
        res.push(React.createElement('td', { name: keys[i], key: keys[i] }, (data[keys[i]]===true)?'✔':data[keys[i]]));
    }
    return (
	React.createElement('tr', {name:props.data.username},
			    res,
			    React.createElement('td', { name: 'control' },
						React.createElement('button', { name: 'edit', onClick:()=>{props.editClick(props.data.id);} }, 'E'),
						React.createElement('button', { name: 'delete', onClick:()=>{props.delClick(props.data.id);} }, 'X')))
	
    );
}

function StatView(props){
    //matrix view
    if (!props.data.length)
	return React.createElement('p',{},'no data to show');
    if (0&&props.data[0].category){
	//extract all categories, associate with column numbers
	let columns = props.data.map(i=>i.category).filter((value, index, self)=>self.indexOf(value) === index);
	let dates=props.data.map(i=>i.exptime).filter((value, index, self)=>self.indexOf(value) === index);
	let matrix={};
	for (let i=0;i<props.data.length;i++){
	    let cell=props.data[i];
	    if (!matrix[cell.exptime])
		matrix[cell.exptime]={};
	    if (!matrix[cell.exptime][cell.category])
		matrix[cell.exptime][cell.category]={};
	    matrix[cell.exptime][cell.category][cell.currency]=cell.summ;
	}
	//console.log(matrix);
	let table=[];
	let totalpercol={};
	for (let i=0;i<dates.length;i++){
	    let row=[StatCell({items:dates[i],key:'date'})];
	    let totalperline={};
	    for (let j=0;j<columns.length;j++){
		row.push(StatCell({key:'c'+j, items:matrix[dates[i]][columns[j]]}));
		for (tots in matrix[dates[i]][columns[j]]){ 
		    totalperline[tots]=(totalperline[tots])?totalperline[tots]+matrix[dates[i]][columns[j]][tots]:matrix[dates[i]][columns[j]][tots];
		    totalpercol[columns[j]]=(totalpercol[columns[j]])?totalpercol[columns[j]]:{};
		    totalpercol[columns[j]][tots]=(totalpercol[columns[j]][tots])?totalpercol[columns[j]][tots]+matrix[dates[i]][columns[j]][tots]:matrix[dates[i]][columns[j]][tots];
		}
	    }
	    row.push(StatCell({key:'ctotal'+i, items:totalperline}));
	    table.push(React.createElement('tr',{key:'r'+i},row));
	}
	let summcol=[StatCell({items:'Summary',key:'summary'})];
	for (let tc in totalpercol)
	    summcol.push(StatCell({items:totalpercol[tc],id:tc,key:tc}))
	table.push(React.createElement('tr',{key:'rtotal'},summcol));
	let thead=React.createElement('thead',{},
				      React.createElement('tr',{},(['Date'].concat(columns)).map(x=>React.createElement('td',{key:'c'+x},x))));
	let tbody=React.createElement('tbody',{},table);
	return React.createElement('table',{},thead,tbody);
    }
    else //diagrams
    {
	let graphs=[];
	let currencies = props.data.map(i=>i.currency).filter((value, index, self)=>self.indexOf(value) === index);
	for (let i=0;i<currencies.length;i++){
	    let data=props.data.map(x=>Object.assign({},{"day":x.exptime.slice(-2),"summ":(x.currency==currencies[i])?x.summ:0,"cat":x.category}));
	    console.log(data);
	    graphs.push(React.createElement(VBarChart,{key:currencies[i],curr:currencies[i],data:data}));
	}
	return React.createElement('div',{},graphs);
    }
}

class VBarChart extends React.Component{
    constructor(props) {
	super(props);
	this.state = {
	    data:props.data
	};
    }
    componentDidMount() {
	const { data, highlightedPoint } = this.props;
	const spec = this._spec();
	var view = new vega.View(vega.parse(spec), {
	    logLevel: vega.Warn,
	    renderer: 'canvas'
	}).initialize('#chartContainer'+this.props.curr).hover().run();
    }
    
    componentDidUpdate() {
	const spec = this._spec();
	var view = new vega.View(vega.parse(spec), {
	    //loader: vega.loader({baseURL: '/vega/'}),
	    logLevel: vega.Warn,
	    renderer: 'canvas'
	}).initialize('#chartContainer'+this.props.curr).hover().run();
    }
    
    // dummy render method that creates the container vega draws inside
    render() {
	return React.createElement('div',{ref:'chartContainer'+this.props.curr, id:'chartContainer'+this.props.curr});
    }
    // the vega spec for the chart
    _spec() {
	return {
	    "$schema": "https://vega.github.io/schema/vega/v4.json",
	    "width": 500,
	    "height": 200,
	    "padding": 5,

	    "data": [
		{
		    "name": "table",
		    "values": this.state.data/*[
			{"exptime": 'a', "y": 28, "c":0}, {"exptime": 'a', "y": 55, "c":1},
			{"exptime": 9, "y": 49, "c":0}, {"exptime": 9, "y": 15, "c":1}
		    ]*/,
		    "transform": [
			{
			    "type": "stack",
			    "groupby": ["day"],
			    "sort": {"field": "cat"},
			    "field": "summ"
			}
		    ]
		}
	    ],

	    "scales": [
		{
		    "name": "x",
		    "type": "band",
		    "range": "width",
		    "domain": {"data": "table", "field": "day"}
		},
		{
		    "name": "y",
		    "type": "linear",
		    "range": "height",
		    "nice": true, "zero": true,
		    "domain": {"data": "table", "field": "y1"}
		},
		{
		    "name": "color",
		    "type": "ordinal",
		    "range": "category",
		    "domain": {"data": "table", "field": "cat"}
		}
	    ],

	    "axes": [
		{"orient": "bottom", "scale": "x", "zindex": 1},
		{"orient": "left", "scale": "y", "zindex": 1}
	    ],

	    "marks": [
		{
		    "type": "rect",
		    "from": {"data": "table"},
		    "encode": {
			"enter": {
			    "x": {"scale": "x", "field": "day"},
			    "width": {"scale": "x", "band": 1, "offset": -1},
			    "y": {"scale": "y", "field": "y0"},
			    "y2": {"scale": "y", "field": "y1"},
			    "fill": {"scale": "color", "field": "cat"}
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
	};
    }
    
}

function StatCell(props){
    if (typeof(props.items)=='string')
	return React.createElement('td',{key:props.key},props.items);
    let items=[];
    if (typeof(props.items)=='object')
	for (i in props.items){
	    items.push(React.createElement('p',{onClick:()=>{null}, key:[i]},props.items[i]+' '+i));
	}
    return React.createElement('td',{key:props.key},items);
}

class Area extends React.Component{ 
    constructor(props){
	super(props);
	this.newrecord=-1;
	this.tablemode=-2;
	this.statmode=-3;
	this.state=Object.assign({message:'', editmode:this.tablemode},props);
    }
    editObj(id) {
	this.setState({editmode:id});
    }
    delObj(id) {
	ajaxRequest('POST','delete',(a)=>this.updateData(a),JSON.stringify({id:id}));
    }
    updateData(responseText){
	let newdata=Object.assign(this.state.data);
	let answer = JSON.parse(responseText);
	if (answer['error'])
	    this.setState({message:answer['error']})
	else{
	    if (answer['saved']){
		for (let i=0;i<answer['saved'].length;i++){
		    let item=newdata.find((el)=>{return el.id==answer['saved'][i].id});
		    item?newdata.splice(newdata.indexOf(item),1,answer['saved'][i]):newdata.push(answer['saved'][i]);
		}
	    }
	    if (answer['deleted']){
		let item=newdata.find((el)=>{return el.id==answer['deleted']});
		if (item)
		    newdata.splice(newdata.indexOf(item),1)
	    }
	    this.setState({data:newdata})
	}
    }
    cancelEdit(){
	this.setState({editmode:this.tablemode});
    }
    
    saveEdit(data){
	ajaxRequest('POST','/exp/save',(u)=>this.updateData(u),JSON.stringify(data));
	this.setState({editmode:this.tablemode});
    }
    requestTable() {
	ajaxRequest('GET','/exp/table?from='+this.state.datefrom+'&to='+this.state.dateto,(d)=>this.processTable(d));
    }
    requestStat(stattype) {
	ajaxRequest('GET','/exp/stat?'+'agg='+stattype+'&from='+this.state.datefrom+'&to='+this.state.dateto,(d)=>this.processTable(d,'stat'));
    }
    
    processTable(responseText, stat) {
	let resp = JSON.parse(responseText);
	if (resp['error'])
	    this.setState({message:resp['error']})
	else
	    this.setState(stat?{stat:resp,editmode:this.statmode}:{data:resp,editmode:this.tablemode});

    }

    handleDateChange(event){
	    this.setState({[event.target.name]: event.target.value});
    }
    render() {
	/*new record button*/
	let formbtn=React.createElement('button', { name: 'formview', onClick:()=>{this.editObj(this.newrecord);} }, 'new');
	/*list button*/
	let tablebtn=React.createElement('button', { name: 'tableview', onClick:()=>{this.requestTable();} }, 'table view');
	/*Statistic buttons*/
	let statistics={'catdate':'category & date','date':'date & currency','incomedate':'Incomes'};
	let statbuttons=[];
	for (let key in statistics)
	    statbuttons.push(React.createElement('button', { name: key, key:key, onClick:()=>{this.requestStat(key);} },statistics[key] ));

	/*date fields*/
	let datefrom=React.createElement('input',{name: 'datefrom', type:'date', value:this.state.datefrom, onChange:(e)=>{this.handleDateChange(e);},'data-date-format':"YYYY-DD-MM"});
	let dateto=React.createElement('input',{name: 'dateto', type:'date', value:this.state.dateto, onChange:(e)=>{this.handleDateChange(e);},'data-date-format':"YYYY-DD-MM"});
	
	let controls=React.createElement('div',{className:"col-lg-3 col-md-3 col-sm-12"},formbtn,tablebtn,datefrom,dateto,statbuttons);
	let status = React.createElement('div',{className:"col-lg-12 col-md-12 col-sm-12"},this.state.message);
	let workarea='';
	if (this.state.editmode==this.newrecord){
	    workarea=React.createElement('div', {className:"col-lg-9 col-md-9 col-sm-12"},
					 React.createElement(EditForm,{data:null,
								       settings:this.state.settings,
								       lists:this.state.lists,
								       fields:this.state.fields,
								       saveClick:(form)=>{this.saveEdit(form)},
								       cancelClick:()=>{this.cancelEdit()}}));
	}
	if (this.state.editmode>this.newrecord){
	    workarea=React.createElement('div',{className:"col-lg-9 col-md-9 col-sm-12"},
					 React.createElement(EditForm,{data:this.state.data.find((el)=>{return el.id==this.state.editmode}),
								       lists:this.state.lists,
								       fields:this.state.fields,
								       saveClick:(form)=>{this.saveEdit(form)},
								       cancelClick:()=>{this.cancelEdit()}}));
	}
	if (this.state.editmode==this.tablemode){
	    workarea=React.createElement('div',{className:"col-lg-9 col-md-9 col-sm-12"},
					 React.createElement(TableView, { data:this.state.data,
									  editClick:(id)=>this.editObj(id),
									  delClick:(id)=>this.delObj(id),  name: 'tableview' }));
	}
	/*TODO: create processing for statistics*/
	if (this.state.editmode==this.statmode){
	    workarea=React.createElement('div',{className:"col-lg-9 col-md-9 col-sm-12"},
					 React.createElement(StatView, { data:this.state.stat, name: 'stat' }));
	}
	return (React.createElement('div',{className:"row"},controls,workarea,status));
    }
}


    
