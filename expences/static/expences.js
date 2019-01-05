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
    let area=ReactDOM.render(React.createElement(Area, { data:null, stat:null, lists:data.lists,settings:data.settings,fields:data.fields, dateto:dateto, datefrom:datefrom, name: 'Expences', charts:true, table:true, quick_cats:data.quick_cats, vegaspec:makeVegaSpecs() }),document.getElementById('area'));
    area.requestStat();
    area.requestTable();
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
	if (event.target.name!='id'){
	    let val=(event.target.name=='summ')?event.target.value.replace(',','.'):event.target.value
	    this.setState({[event.target.name]: val});
	}
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
		field =  React.createElement('select',{className:"m-2  m-lg-0",name: fields[i], type:'text', value:this.state[fields[i]], onChange:this.handleChange},options)
	    }
	    else 
	    {
		if (fields[i].substr(0,3)=='is_')
		    field =  React.createElement('input',{className:"m-2 m-lg-0",name: fields[i], type:'checkbox', checked:this.state[fields[i]], onChange:(e)=>this.handleCheckbox(e)})
		else{
		    let fieldtype=(fields[i]=='exptime')?'date':'text';	
		    field =  React.createElement('input',{className:"m-2 m-lg-0",name: fields[i], type:fieldtype, value:this.state[fields[i]], onChange:this.handleChange,'data-date-format':"YYYY-DD-MM"})
		}
	    }
            res.push(React.createElement('tr', { name: fields[i], key: fields[i] },
					 React.createElement('td',{name: fields[i]}, fields[i]),
					 React.createElement('td',{name: fields[i]}, field)
					)
		    );
        }
	let save= React.createElement('input',{className:"m-2  m-lg-0",name:'save', type:'submit',value:'save'});
	let cancel= React.createElement('input',{className:"m-2  m-lg-0",name:'cancel', type:'button', onClick:()=>this.props.cancelClick(),value:'close'});
	let quick_cats=this.props.quick_cats;
	let quickbar=[];
	if (quick_cats){
	    for (let i=0;i<quick_cats.length;i++){
		quickbar.push(React.createElement('input',{type:'image', key:quick_cats[i],
							   className:'quickbutton',
							   src:window.location.pathname+'static/img/'+quick_cats[i].replace('/','_')+'.png',
							   onClick:(event)=>{this.setState({category:quick_cats[i]});event.preventDefault();},
							   alt:quick_cats[i]
							  }));
	    }
	}
	return React.createElement('form',{id:'editform',name:'editform',onSubmit:(e)=>this.handleSubmit(e)},
				   quickbar,
				   React.createElement('table',{},React.createElement('tbody',{},res)),
				   save,cancel);
    }
}

function TableView(props){
    let hres=[];
    let data=props.data;
    if (data==null || data.length<1)
	return React.createElement('p',{},'no data to show');
    let keys=Object.keys(data[Object.keys(data)[0]]);
	for (let i=0;i< keys.length;i++){
	    	if (keys[i]!='id')
		    hres.push(React.createElement('td', { name: keys[i], key: keys[i] }, keys[i]));
        }
    let headlines=React.createElement('tr',{},hres);
    let datalines=[];
    let ids=Object.keys(data)
    for (let i = 0; i < ids.length; i++) {
        datalines.push(
	    React.createElement(Tableline, {num:i, key:ids[i], data:data[ids[i]], editClick:(i)=>{props.editClick(i)}, delClick:(i)=>props.delClick(i), readonly:props.readonly})
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
	if (keys[i]!='id')
            res.push(React.createElement('td', { name: keys[i], key: keys[i] }, (data[keys[i]]===true)?'✔':data[keys[i]]));
    }
    let bootstrap='border-top';
    return (
	React.createElement('tr', {name:props.data.username, className:bootstrap},
			    res,
			    (props.readonly)?null:React.createElement('td', { name: 'control' },
						React.createElement('button', { name: 'edit', onClick:()=>{props.editClick(props.data.id);} }, 'E'),
						React.createElement('button', { name: 'delete', onClick:()=>{props.delClick(props.data.id);} }, 'X')))
    );
}

function StatView(props){
    //matrix view - statistics table
    let data=props.data.data.slice(0);
    let type=props.data.type;
    if (!props.charts){
	//extract all categories, associate with column numbers, uniq with filter
	if (type=='bar'){
	    let columns = data.map(i=>i.category).filter((value, index, self)=>self.indexOf(value) === index);
	    let dates=data.map(i=>i.exptime).filter((value, index, self)=>self.indexOf(value) === index);
	    let matrix={}; //matrix to me reflected to table
	    for (let i=0;i<data.length;i++){
		let cell=data[i];
		if (!matrix[cell.exptime])
		    matrix[cell.exptime]={};
		if (!matrix[cell.exptime][cell.category])
		    matrix[cell.exptime][cell.category]={};
		matrix[cell.exptime][cell.category][cell.currency]=cell.summ;
	    }
	    //console.log(matrix);
	    let table=[]; //showing matrix
	    let totalpercol={}; //summary per column
	    for (let i=0;i<dates.length;i++){
		let row=[StatCell({items:dates[i],key:'date'})]; //dates
		let totalperline={}; //summary per day
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
    }
    else //diagrams
    {
	let graphs=[];
	let currencies = data.map(i=>i.currency).filter((value, index, self)=>self.indexOf(value) === index);
	for (let i=0;i<currencies.length;i++){
	    if (type=='bar'){
		let chartdata=data.map(x=>Object.assign({},{"day":x.exptime,"summ":(x.currency==currencies[i])?x.summ:0,"cat":x.category}));
		let barchart=(React.createElement(VegaChart,{className:"col-lg-6 col-md-12 col-sm-12", key:'b'+currencies[i],curr:currencies[i],data:chartdata, spec:props.vegaspec['bar'], type:'bar', requestfun:props.requestfun}));
		let piechart=(React.createElement(VegaChart,{className:"col-lg-6 col-md-12 col-sm-12", key:'p'+currencies[i],curr:currencies[i],data:chartdata, spec:props.vegaspec['pie'], type:'pie', requestfun:props.requestfun}));
		graphs.push(React.createElement('div',{key:i,className: "col-lg-12 col-md-12 col-sm-12" },barchart,piechart));
	    }
	    if (type=='gauge'){
		let chartdata=data.map(x=>{return (x.currency==currencies[i])?Object.assign({},{"day":x.month,"summ":x.summ,"cat":x.is_expence?'expence':'income'}):null}).filter(x=>x!=null);
		graphs.push(React.createElement(VegaChart,{className:"col-lg-6 col-md-12 col-sm-12", key:'g'+currencies[i],curr:currencies[i],data:chartdata, spec:props.vegaspec['gauge'], type:'gauge', requestfun:()=>false}));
		graphs.push(React.createElement(VegaChart,{key:'p'+currencies[i],curr:currencies[i],data:chartdata, spec:props.vegaspec['pie'], type:'pie', requestfun:()=>false}));
	    }
	}
	return React.createElement('div',{},graphs);
    }
}

class VegaChart extends React.Component{
    componentDidMount() {
	this.drawVega();
    }
    componentDidUpdate() {
	this.drawVega();
    }
    drawVega(){
	let title={"text":"expenses by date, "+this.props.curr};
	const spec = this.props.spec(this.props.data, title);
	var view = new vega.View(vega.parse(spec), {
	    logLevel: vega.Warn,
	    renderer: 'svg'
	}).initialize('#chartContainer'+this.props.type+this.props.curr).hover().run();
    	view.addEventListener('click', (event,value)=>{if(value)this.props.requestfun(value.datum.cat, true, value.datum.day, value.datum.day, event.clientX, event.clientY)});
    }
    // dummy render method that creates the container vega draws inside
    render() {
	return React.createElement('div',{className:"col-lg-6 col-md-12 col-sm-12 d-inline align-top", id:'chartContainer'+this.props.type+this.props.curr},'aaa');
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
    let bootstrap='border-top';
    return React.createElement('td',{key:props.key, className:bootstrap},items);
}

class Tooltip extends React.Component{
    constructor(props){
	super(props);
	this.state={styles:props.style};
    }
    componentDidMount() {
	this.setState({styles:this.props.style});
    }
    componentWillReceiveProps(nextProps){
	this.setState({styles:nextProps.style});
    }
    render(){
	let closebtn=React.createElement('p',{onClick:()=>this.props.close(), className:"font-weight-bold float-right"},'X');
	let table=React.createElement(TableView,{data:this.props.data, name: 'helpertable', readonly:true});
	//console.log(this.state.styles);
	let bootstrap='position-absolute border border-dark bg-light rounded p-2'
	return React.createElement('div',{className:'tltip '+bootstrap, style:this.state.styles},closebtn,table);
    }
}

class Area extends React.Component{ 
    constructor(props){
	super(props);
	this.newrecord=-1;
	this.tablemode=-2;
	this.statmode=-3;
	this.state=Object.assign({message:'', editmode:this.tablemode, tooltip:null,tooltiposition:{left:100,top:100}},props);
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
    requestTable(category,shorter,dateto,datefrom,X,Y) {
	let params='';
	params+='?from='+(datefrom?datefrom:this.state.datefrom);
	params+='&to='+(dateto?dateto:this.state.dateto);
	if (category)
	    params+='&category='+category;
	if (shorter)
	    params+='&short=true';
	if (X&&Y){
	 let topOff  = window.pageYOffset || document.documentElement.scrollTop,
	     leftOff = window.pageXOffset || document.documentElement.scrollLeft;
	    this.setState({tooltiposition:{left:X+leftOff,top:Y+topOff}});
	}
	ajaxRequest('GET','/exp/table'+params,(d)=>this.processTable(d,false,shorter));
    }
    requestStat(stattype) {
	let request='/exp/stat?'+'agg='+stattype+'&from='+this.state.datefrom+'&to='+this.state.dateto;
	if (!stattype){
	    request='/exp/stat'
	}
	ajaxRequest('GET',request,(d)=>this.processTable(d,'stat'));
    }
    
    processTable(responseText, stat, helper) {
	let resp = JSON.parse(responseText);
	if (resp['error'])
	    this.setState({message:resp['error']})
	else{
	    if (helper)
		this.setState({tooltip:resp});
	    else
		this.setState(stat?{stat:resp}:{data:resp});
	}
    }

    handleDateChange(event){
	    this.setState({[event.target.name]: event.target.value});
    }
    handleCheckbox(event) {
	this.setState({[event.target.name]: event.target.checked});
    }
    render() {
	/*new record button*/
	let formbtn=React.createElement('button', { className:"m-2 m-lg-0", name: 'formview', onClick:()=>{this.editObj(this.newrecord);} }, 'new');
	/*list button*/
	let tablebtn=React.createElement('button', {className:"m-2  m-lg-0", name: 'tableview', onClick:()=>{this.requestTable();} }, 'request data');
	/*Statistic buttons*/
	let statbuttons=[];
	//display parameters flags
	statbuttons.push(React.createElement('p',{key:'chart', className:"m-2  m-lg-0"},
					     'show Charts',
					     React.createElement('input',{type:'checkbox',name:'charts', checked:this.state.charts, onChange:(e)=>this.handleCheckbox(e)})));
	statbuttons.push(React.createElement('p',{key:'table', className:"m-2  m-lg-0"},
					     'show table',
					     React.createElement('input',{type:'checkbox',name:'table', checked:this.state.table, onChange:(e)=>this.handleCheckbox(e)})));
	//the entrie buttons
	let statistics={'catdate':'category & date','date':'date & currency','incomedate':'Incomes',
			'year_gauge':'Year balance','year_cats':'Year by categories'};
	statbuttons.push(React.createElement('p',{key:'title', className:'align-bottom mb-0 mt-2'},'Statistic'));
	for (let key in statistics)
	    statbuttons.push(React.createElement('button', { className:"m-2  m-lg-0", name: key, key:key, onClick:()=>{this.requestStat(key);} },statistics[key] ));
	/*date fields*/
	let datefrom=React.createElement('input',{className:"m-2  m-lg-0", name: 'datefrom', type:'date', value:this.state.datefrom, onChange:(e)=>{this.handleDateChange(e);},'data-date-format':"YYYY-DD-MM"});
	let dateto=React.createElement('input',{className:"m-2  m-lg-0",name: 'dateto', type:'date', value:this.state.dateto, onChange:(e)=>{this.handleDateChange(e);},'data-date-format':"YYYY-DD-MM"});
	
	let controls=React.createElement('div',{className:"col-lg-3 col-md-12 col-sm-12"},formbtn,tablebtn,datefrom,dateto,statbuttons);
	let status = React.createElement('div',{className:"col-lg-12 col-md-12 col-sm-12"},this.state.message);
	let workarea=React.createElement('div', {className:"col-lg-9 col-md-12 col-sm-12"});
	if (this.state.editmode==this.newrecord){
	    workarea=React.createElement('div', {className:"col-lg-9 col-md-12 col-sm-12"},
					 React.createElement(EditForm,{data:null,
								       quick_cats:this.state.quick_cats,
								       settings:this.state.settings,
								       lists:this.state.lists,
								       fields:this.state.fields,
								       saveClick:(form)=>{this.saveEdit(form)},
								       cancelClick:()=>{this.cancelEdit()}}));
	}
	if (this.state.editmode>this.newrecord){
	    workarea=React.createElement('div',{className:"col-lg-9 col-md-12 col-sm-12"},
					 React.createElement(EditForm,{data:this.state.data.find((el)=>{return el.id==this.state.editmode}),
								       lists:this.state.lists,
								       fields:this.state.fields,
								       saveClick:(form)=>{this.saveEdit(form)},
								       cancelClick:()=>{this.cancelEdit()}}));
	}
	if (this.state.editmode==this.tablemode){
	    workarea=React.createElement('div',{className:"col-lg-9 col-md-12 col-sm-12 my-3 py-1 border border-info"},
					 React.createElement(TableView, { data:this.state.data,
									  editClick:(id)=>this.editObj(id),
									  delClick:(id)=>this.delObj(id),  name: 'tableview' }));
	}
	/* statistics*/
	let statarea=null
	if (this.state.stat){
	    statarea=React.createElement('div',{className:"col-lg-12 col-md-12 col-sm-12 my-3 border border-info"},
					     React.createElement(StatView, { data:this.state.stat, name: 'stat', charts:this.state.charts, vegaspec:this.state.vegaspec, requestfun:(a,b,c,d,e,f)=>this.requestTable(a,b,c,d,e,f) }));
	}
	let tooltip=null;
	if (this.state.tooltip)
	    tooltip=React.createElement(Tooltip,{data:this.state.tooltip, style:this.state.tooltiposition, close:()=>{this.setState({tooltip:null});}});
	return (React.createElement('div',{className:"row"},controls,workarea,statarea, status,tooltip));
    }
}


