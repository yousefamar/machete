// Modified under ISC from https://observablehq.com/@d3/tree

import * as d3 from "d3";

// Colors
const circleFill = 'var(--background-primary)';
const bgColor = 'var(--background-primary)';
const bgColorAlt = 'var(--background-primary-alt)';
const labelColor = 'var(--text-normal)';
const labelWithLinkColor = 'var(--text-accent)';
const lineColor = 'var(--text-normal)';


export class CirclesVis {

  width = 1000;//root.r * 2 + 100;
  height = 1000;//root.r * 2 + 100;
  scale = 100;

  svg = null;
  g = null;
  descendants = null;
  cover = null;
  zoom = null;
  lastTransform = null;
  dragBlur = null;

  constructor() {

    const zoom = this.zoom = d3.zoom()
      .filter(event => event.type === 'wheel' || event.button === 1)
      .on('zoom', (e) => {
        //console.log(e.transform.k);
        this.descendants.forEach(d => {
          //console.log(d.r * e.transform.k);
          if (d.r * e.transform.k > 0.5 * this.scale * 1000) {
            d.opacity = 0;
          } else
            d.opacity = 1;
        });

        const t = d3.transition()
          .duration(100)
          .ease(d3.easeLinear);

        try {
          this.cover.transition(t).attr("opacity", d => d.children ? d.opacity : 1)
        } catch (error) {}
        this.cover.attr("pointer-events", d => !d.children || d.opacity ? "all" : "none")

        this.g.attr('transform', e.transform);
        this.lastTransform = e.transform;
      });

    this.svg = d3.create("svg")
      .attr("viewBox", [0, 0, this.width * this.scale, this.height * this.scale])
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .style("width", "100%")
      .style("height", "100%")
      .call(zoom);

    this.g = this.svg.append("g");

    const defs = this.svg.append("defs");

    const filter = defs.append("filter")
      .attr("id", "f1")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter.append("feOffset")
      .attr("result", "offOut")
      .attr("in", "SourceAlpha")
      .attr("dx", "0")
      .attr("dy", "0");

    this.dragBlur = filter.append("feGaussianBlur")
      .attr("result", "blurOut")
      .attr("in", "offOut");

    filter.append("feComponentTransfer")
      .attr("result", "transferOut")
      .append("feFuncA")
      .attr("type", "linear")
      .attr("slope", "0.2");

    filter.append("feBlend")
      .attr("in", "SourceGraphic")
      .attr("in2", "transferOut")
      .attr("mode", "normal");
  }

  getLabel(d, n) {
    return d?.data?.label || d?.data?.title || d.id.split('/').pop().replace(/-/g, ' ').replace(/./, c => c.toUpperCase());
  }

  getLink(d, n) {
    return d?.data?.url;
  }

  getDomNode() {
    return this.svg.node();
  }

  update(data, renameFile) {
    //const root = d3.hierarchy(data, children);
    let root = d3.stratify().path(d => d.url)(data);
    root = d3.hierarchy(root, d => d.children);
  
    // Modified under ISC from https://observablehq.com/@d3/pack
    const sort = (a, b) => d3.descending(a.value, b.value); // how to sort nodes prior to layout
    const stroke = labelColor; // stroke for internal circles
    const strokeWidth = 100; // stroke width for internal circles
    const strokeOpacity = 1; // stroke opacity for internal circles

    root.sum(d => {
      return Math.max(0, 0.01 * (d.data?.characterCount || 1))
    });

    // Compute labels and titles.
    const descendants = this.descendants = root.descendants().reverse();
    const leaves = descendants.filter(d => !d.children);
    leaves.forEach((d, i) => d.index = i);
    const L = leaves.map(d => this.getLabel(d.data, d));
    const T = descendants.map(d => this.getLabel(d.data, d));

    // Sort the leaves (typically by descending value for a pleasing layout).
    if (sort != null) root.sort(sort);

    // Compute the layout.
    // TODO: compute width based on sum of max title char length of each level

    d3.pack()
      .size([this.width * this.scale, this.height * this.scale])
      .padding(d => d.r * this.scale)
      (root);

    const node = this.g.selectAll("g")
      .data(descendants, d => d.url)
      .join("g")
      // .join(
      //   enter => enter.append("g")
      //     .attr("transform", d => `translate(${d.x},${d.y}) scale(0)`)
      //     .call(enter => enter.transition().duration(1000)
      //       .attr("transform", d => `translate(${d.x},${d.y}) scale(1)`)
      //     ),
      //   update => update
      //     .attr("transform", d => `translate(${d.x},${d.y}) scale(1)`)
      //   ,
      //   exit => exit
      //     .call(exit => exit.transition().duration(1000)
      //       .attr("transform", d => `translate(${d.x},${d.y}) scale(0)`)
      //       .remove()
      //     )
      // );
      .attr("transform", d => `translate(${d.x},${d.y})`);


    const cover = this.cover = node
      .append('g')
      .attr("opacity", 1);

    cover
      .append("circle")
      .attr("fill", d => d.children ? bgColor : bgColorAlt)
      .attr("fill-opacity", d => d.children ? 0.9 : 1)
      .attr("r", d => d.r);

    cover
      .append("a")
      .attr("xlink:href", d => this.getLink(d.data, d))
      .attr("target", '_blank')
      .style("text-decoration", "none")
      .append("text")
      .attr("dy", d => "0.32em")
      .attr("text-anchor", "middle")
      .attr("paint-order", "stroke")
      .attr("fill", d => d.data?.data?.url ? labelWithLinkColor : labelColor)
      .attr("font-size", (d, i) => ((this.scale / 50) * d.r / T[i].length) + 'px')
      .attr("cursor", d => d.data?.data?.url ? "inherit" : "default")
      .text((d, i) => T[i]);

    // permanent border
    node.append("circle")
      .attr("stroke", d => d.children ? stroke : null)
      .attr("stroke-width", d => d.children ? strokeWidth : null)
      .attr("stroke-opacity", d => d.children ? strokeOpacity : null)
      .attr("fill", "transparent")
      .attr("pointer-events", "none")
      .attr("r", d => d.r);

    this.svg.call(this.zoom.transform, this.lastTransform || d3.zoomIdentity);

    function recurOnChildren(e, d) {
      d.x += e.dx;
      d.y += e.dy;
      if (!d.children) return;
      d.children.forEach(c => {
        recurOnChildren(e, c);
      });
    }

    function getNodeAtPoint(root, nodeX, nodeY) {
      // recursively find the highest-level node at this point
      // if node has a parent with an opaque cover, return that node

      // Ignore non-dirctory nodes
      if (!root.children || root.children.length < 1) return null;

      // Check if mouse is within this node
      const dx = nodeX - root.x;
      const dy = nodeY - root.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > root.r) return null;

      // If this node is opaque, return it
      if (root.opacity > 0) return root;

      for (let i = 0; i < root.children.length; ++i) {
        const node = getNodeAtPoint(root.children[i], nodeX, nodeY);
        if (node) return node;
      }

      return root;
    }

    var nextSibling;
    const self = this;

    var drag = d3.drag()
      // .filter(event => event.ctrlKey)
      .on("start", function (e, d) {
        const parent = d.parent;
        // console.log(parent.data.id);
        nextSibling = this.nextSibling;
        d3.select(this).raise();
        d3.select(this).style("cursor", "grabbing");
        self.dragBlur.attr("stdDeviation", d.r * 0.1);
        d3.select(this).attr("filter", "url(#f1)");
      })
      .on("drag", function (e, d) {
        recurOnChildren(e, d);
        node.attr("transform", d => `translate(${d.x},${d.y})`);
      })
      .on("end", async function (e, d) {
        d3.select(this).style("cursor", "auto");
        d3.select(this).attr("filter", null);
        // d3.select(this).lower();
        if (nextSibling) {
          this.parentNode.insertBefore(this, nextSibling);
        }

        const newParent = getNodeAtPoint(root, d.x, d.y);
        const fileName = d.data.data?.fileName || d.data.id.split('/').pop();

        console.log('Moving', d.data.id, 'to', newParent.data.id + '/' + fileName);

        // const loadingOverlay = document.getElementById('loading-overlay');
        // loadingOverlay.style.display = 'block';
        await renameFile(d.data.id, newParent.data.id + '/' + fileName);
        // loadingOverlay.style.display = 'none';
      });

    node.call(drag);

  }
}



export function createTree(data) {
  const getLabel = (d, n) => d?.label || d?.title || n.id.split('/').pop().replace(/-/g, ' ').replace(/./, c => c.toUpperCase());

  const getLink = (d, n) => d?.url;

  //const root = d3.hierarchy(data, children);
  const root = d3.stratify().path(d => d.url)(data);

  // Sort the nodes.
  //sort, // how to sort nodes prior to layout (e.g., (a, b) => d3.descending(a.height, b.height))
  //if (sort != null) root.sort(sort);

  // Compute the layout.
  // TODO: compute width based on sum of max title char length of each level
  const dx = 30;
  const dy = 300;
  d3.tree().nodeSize([dx, dy])(root);

  // Center the tree.
  let minY = Infinity;
  let maxY = -minY;
  let minX = Infinity;
  let maxX = -minY;
  root.each(d => {
    if (d.x > maxY) maxY = d.x;
    if (d.x < minY) minY = d.x;
    if (d.y > maxX) maxX = d.y;
    if (d.y < minX) minX = d.y;
  });

  // Compute the default dims
  const width = maxX - minX;
  const height = maxY - minY;

  const svg = d3.create("svg")
    .attr("viewBox", [minX - dy, minY - dx, width + 2 * dy, height + 2 * dx])
    .attr("width", width + 2 * dy)
    .attr("height", height + 2 * dx)
    .style("height", "100%")
    .style("width", "auto")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .style("margin", "2rem 1rem");

  svg.append("g")
    .attr("fill", "none")
    .attr("stroke", lineColor)
    .attr("stroke-opacity", 0.4)
    //.attr("stroke-linecap", strokeLinecap)
    //.attr("stroke-linejoin", strokeLinejoin)
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(root.links())
    .join("path")
    .attr("d", d3.linkHorizontal()
      .x(d => d.y)
      .y(d => d.x));

  const node = svg.append("g")
    .selectAll("a")
    .data(root.descendants())
    .join("a")
    .attr("xlink:href", d => getLink(d.data, d))
    .attr("target", "_blank")
    .attr("transform", d => `translate(${d.y},${d.x})`);

  node.append("circle")
    .attr("fill", d => d.data ? labelWithLinkColor : labelColor)
    //.attr("opacity", d => d.data ? 1 : 0);
    .attr("r", 3)

  //if (title != null) node.append("title")
  //    .text(d => title(d.data, d));

  // Compute labels and titles.
  const descendants = root.descendants();
  const L = descendants.map(d => getLabel(d.data, d));

  node.append("text")
    .attr("dy", "0.32em")
    .attr("x", d => d.children ? -6 : 6)
    .attr("text-anchor", d => d.children ? "end" : "start")
    .attr("paint-order", "stroke")
    .attr("fill", d => d.data ? labelWithLinkColor : labelColor)
    .attr("stroke", bgColor)
    .attr("stroke-width", "8px")
    .style("font-size", "1rem")
    .text((d, i) => L[i]);

  return svg.node();
}