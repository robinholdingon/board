	var day = d3.time.format("%w"),
	    week = d3.time.format("%U"),
	    percent = d3.format(".1%"),
	    format = d3.time.format("%Y-%m-%d");
	var width = 960,
	    height = 136,
    	cellSize = 17; // cell size

function drawCalendarChart() {
	// for calendar chart




	var color = d3.scale.quantize()
	    .domain([-.05, .05])
	    .range(d3.range(11).map(function(d) { return "q" + d + "-11"; }));

	var svg = d3.select('#fuel-calendar').selectAll("svg")
	    .data(d3.range(1990, 2011))
	  .enter().append("svg")
	    .attr("width", width)
	    .attr("height", height)
	    .attr("class", "RdYlGn")
	  .append("g")
	    .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + (height - cellSize * 7 - 1) + ")");

	svg.append("text")
	    .attr("transform", "translate(-6," + cellSize * 3.5 + ")rotate(-90)")
	    .style("text-anchor", "middle")
	    .text(function(d) { return d; });

	var rect = svg.selectAll(".calendar-chart-day")
	    .data(function(d) { return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
	  .enter().append("rect")
	    .attr("class", "day")
	    .attr("width", cellSize)
	    .attr("height", cellSize)
	    .attr("x", function(d) { return week(d) * cellSize; })
	    .attr("y", function(d) { return day(d) * cellSize; })
	    .datum(format);

	rect.append("title")
	    .text(function(d) { return d; });

	// the code below can cause google map plugin failure
	svg.selectAll(".calendar-chart-month")
	    .data(function(d) { return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
	  .enter().append("path")
	    .attr("class", "month")
	    .attr("d", monthPath);

	d3.csv("dji.csv", function(error, csv) {
	  var data = d3.nest()
	    .key(function(d) { return d.Date; })
	    .rollup(function(d) { return (d[0].Close - d[0].Open) / d[0].Open; })
	    .map(csv);

	rect.filter(function(d) { return d in data; })
	    .attr("class", function(d) { return "day " + color(data[d]); })
		.select("title")
		.text(function(d) { return d + ": " + percent(data[d]); });
	});

	d3.select(self.frameElement).style("height", "2910px");
}

function monthPath(t0) {
  var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
      d0 = +day(t0), w0 = +week(t0),
      d1 = +day(t1), w1 = +week(t1);
  return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
      + "H" + w0 * cellSize + "V" + 7 * cellSize
      + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
      + "H" + (w1 + 1) * cellSize + "V" + 0
      + "H" + (w0 + 1) * cellSize + "Z";
}



// for gauge chart
var gauge = function(container, configuration) {
	var that = {};
	var config = {
		size						: 200,
		clipWidth					: 200,
		clipHeight					: 110,
		ringInset					: 20,
		ringWidth					: 20,
		
		pointerWidth				: 10,
		pointerTailLength			: 5,
		pointerHeadLengthPercent	: 0.9,
		
		minValue					: 0,
		maxValue					: 10,
		
		minAngle					: -90,
		maxAngle					: 90,
		
		transitionMs				: 750,
		
		majorTicks					: 5,
		labelFormat					: d3.format(',g'),
		labelInset					: 10,
		
		arcColorFn					: d3.interpolateHsl(d3.rgb('#00ff00'), d3.rgb('#ff0000'))
	};
	var range = undefined;
	var r = undefined;
	var pointerHeadLength = undefined;
	var value = 0;
	
	var svg = undefined;
	var arc = undefined;
	var scale = undefined;
	var ticks = undefined;
	var tickData = undefined;
	var pointer = undefined;

	var donut = d3.layout.pie();
	
	function deg2rad(deg) {
		return deg * Math.PI / 180;
	}
	
	function newAngle(d) {
		var ratio = scale(d);
		var newAngle = config.minAngle + (ratio * range);
		return newAngle;
	}
	
	function configure(configuration) {
		var prop = undefined;
		for ( prop in configuration ) {
			config[prop] = configuration[prop];
		}
		
		range = config.maxAngle - config.minAngle;
		r = config.size / 2;
		pointerHeadLength = Math.round(r * config.pointerHeadLengthPercent);

		// a linear scale that maps domain values to a percent from 0..1
		scale = d3.scale.linear()
			.range([0,1])
			.domain([config.minValue, config.maxValue]);
			
		ticks = scale.ticks(config.majorTicks);
		tickData = d3.range(config.majorTicks).map(function() {return 1/config.majorTicks;});
		
		arc = d3.svg.arc()
			.innerRadius(r - config.ringWidth - config.ringInset)
			.outerRadius(r - config.ringInset)
			.startAngle(function(d, i) {
				var ratio = d * i;
				return deg2rad(config.minAngle + (ratio * range));
			})
			.endAngle(function(d, i) {
				var ratio = d * (i+1);
				return deg2rad(config.minAngle + (ratio * range));
			});
	}
	that.configure = configure;
	
	function centerTranslation() {
		return 'translate('+r +','+ r +')';
	}
	
	function isRendered() {
		return (svg !== undefined);
	}
	that.isRendered = isRendered;
	
	function render(newValue) {
		svg = d3.select(container)
			.append('svg:svg')
				.attr('class', 'gauge')
				.attr('width', config.clipWidth)
				.attr('height', config.clipHeight);
		
		var centerTx = centerTranslation();
		
		var arcs = svg.append('g')
				.attr('class', 'arc')
				.attr('transform', centerTx);
		
		arcs.selectAll('path')
				.data(tickData)
			.enter().append('path')
				.attr('fill', function(d, i) {
					return config.arcColorFn(d * i);
				})
				.attr('d', arc);
		
		var lg = svg.append('g')
				.attr('class', 'label')
				.attr('transform', centerTx);
		lg.selectAll('text')
				.data(ticks)
			.enter().append('text')
				.attr('transform', function(d) {
					var ratio = scale(d);
					var newAngle = config.minAngle + (ratio * range);
					return 'rotate(' +newAngle +') translate(0,' +(config.labelInset - r) +')';
				})
				.text(config.labelFormat);

		var lineData = [ [config.pointerWidth / 2, 0], 
						[0, -pointerHeadLength],
						[-(config.pointerWidth / 2), 0],
						[0, config.pointerTailLength],
						[config.pointerWidth / 2, 0] ];
		var pointerLine = d3.svg.line().interpolate('monotone');
		var pg = svg.append('g').data([lineData])
				.attr('class', 'pointer')
				.attr('transform', centerTx);
				
		pointer = pg.append('path')
			.attr('d', pointerLine/*function(d) { return pointerLine(d) +'Z';}*/ )
			.attr('transform', 'rotate(' +config.minAngle +')');
			
		update(newValue === undefined ? 0 : newValue);
	}
	that.render = render;
	
	function update(newValue, newConfiguration) {
		if ( newConfiguration  !== undefined) {
			configure(newConfiguration);
		}
		var ratio = scale(newValue);
		var newAngle = config.minAngle + (ratio * range);
		pointer.transition()
			.duration(config.transitionMs)
			.ease('elastic')
			.attr('transform', 'rotate(' +newAngle +')');
	}
	that.update = update;

	configure(configuration);
	
	return that;
};

function drawGaugeChart(id) {
	var chartSize = 320;
	if (id != "drowsiness-gauge") {
		chartSize = 280;
	}
	var powerGauge = gauge('#'+id, {
		size: chartSize,
		clipWidth: 300,
		clipHeight: 200,
		ringWidth: 60,
		maxValue: 10,
		transitionMs: 4000,
	});
	powerGauge.render();
	
	function updateReadings() {
		// just pump in random data here...
		powerGauge.update(Math.random() * 10);
	}
	
	// every few seconds update reading values
	updateReadings();
	setInterval(function() {
		updateReadings();
	}, 5 * 1000);
}

function drawStackedBarChart(num) {
	d3.select("svg").remove();
	var margin = {top: 20, right: 80, bottom: 30, left: 40},
    width = 800 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;

	var x = d3.scale.ordinal()
	    .rangeRoundBands([0, width-90], .1);

	var y = d3.scale.linear()
	    .rangeRound([height, 0]);

	var color = d3.scale.ordinal()
	    .range(["#777777", "#60dd5a", "#eead00", "#ee1d00"]);

	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom");

	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left")
	    .tickFormat(d3.format(".2s"));

	var svg = d3.select("#stacked-bar-chart").append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	d3.csv("data.csv", function(error, data) {
	  color.domain(d3.keys(data[0]).filter(function(key) { return key !== "State"; }));
	  data = data.slice(0, num);
	  data.forEach(function(d) {
	    var y0 = 0;
	    d.ages = color.domain().map(function(name) { return {name: name, y0: y0, y1: y0 += +d[name]}; });
	    d.total = d.ages[d.ages.length - 1].y1;
	  });

	  //data.sort(function(a, b) { return b.total - a.total; });

	  x.domain(data.map(function(d) { return d.State; }));
	  y.domain([0, d3.max(data, function(d) { return d.total; })]);

	  svg.append("g")
	      .attr("class", "x axis")
	      .attr("transform", "translate(0," + height + ")")
	      .call(xAxis);

	  svg.append("g")
	      .attr("class", "y axis")
	      .call(yAxis)
	    .append("text")
	      .attr("transform", "rotate(-90)")
	      .attr("y", 6)
	      .attr("dy", ".71em")
	      .style("text-anchor", "end")
	      .text("Headcount")
	      .attr("transform", "translate(70,-20)");

	  var state = svg.selectAll(".state")
	      .data(data)
	    .enter().append("g")
	      .attr("class", "g")
	      .attr("transform", function(d) { return "translate(" + x(d.State) + ",0)"; });

	  state.selectAll("rect")
	      .data(function(d) { return d.ages; })
	    .enter().append("rect")
	      .attr("width", x.rangeBand()+2)
	      .attr("y", function(d) { return y(d.y1); })
	      .attr("height", function(d) { return y(d.y0) - y(d.y1); })
	      .style("fill", function(d) { return color(d.name); });

	  var legend = svg.selectAll(".legend")
	      .data(color.domain().slice().reverse())
	    .enter().append("g")
	      .attr("class", "legend")
	      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

	  legend.append("rect")
	      .attr("x", width - 18)
	      .attr("width", 18)
	      .attr("height", 18)
	      .style("fill", color);

	  legend.append("text")
	      .attr("x", width - 24)
	      .attr("y", 9)
	      .attr("dy", ".35em")
	      .style("text-anchor", "end")
	      .text(function(d) { return d; });

	});
}
var count = 0;
// setInterval(function () {
// 	count ++;
// 	drawStackedBarChart(count);
// }, 3000);
