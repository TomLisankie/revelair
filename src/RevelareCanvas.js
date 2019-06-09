const d3Poly = require("d3-polygon");
const d3 = require("d3");
import {Delaunay} from "d3-delaunay";

class RevelareCanvas {
    constructor(context) {
        this.points = [];
        this.image = new Image();
        this.colorMap = {};
    }

    replaceImage(image, context) {
        this.clearCanvas(context);
        console.log("canvas cleared?")
        const newImage = new Image();
        newImage.src = image;

        newImage.onload = (event) => {
            this.image = newImage;
            this.renderImage(context);
            this.calculateColorMap(context);
            this.draw(context);
        };
    }

    clearCanvas(context) {
        context.fillStyle = RevelareCanvas.BG_COLOR;
        context.fillRect(0, 0, RevelareCanvas.DIM_X, RevelareCanvas.DIM_Y);
    }

    renderImage(context) {
        context.drawImage(this.image, 0, 0, this.image.width, this.image.height,
                                        0, 0, RevelareCanvas.DIM_X, RevelareCanvas.DIM_Y);
    }

    calculateColorMap(context) {

        let reds = [];
        let greens = [];
        let blues = [];
        let alpha = [];

        const colorMap = context.getImageData(0, 0, 
            RevelareCanvas.DIM_X, RevelareCanvas.DIM_Y);

        let colorfuls = [reds, greens, blues, alpha];
        for(let i = 0; i < colorMap.data.length; i++) {
            colorfuls[i%4].push(colorMap.data[i]);
        }

        let reds2d = [];
        let greens2d = [];
        let blues2d = [];

        for(let i = 0; i < RevelareCanvas.DIM_Y; i++) {

            reds2d.push(reds.splice(0, RevelareCanvas.DIM_X));
            greens2d.push(greens.splice(0, RevelareCanvas.DIM_X));
            blues2d.push(blues.splice(0, RevelareCanvas.DIM_X));

        }
        console.log("reds2d: ", reds2d);
        this.colorMap = {
            reds: reds2d,
            greens: greens2d,
            blues: blues2d
        };
        console.log(this.colorMap);

    }

    addPoint(point) {
        this.points.push(point);
    }

    getPoints() {
        return this.points;
    }

    draw(context) {
        this.clearCanvas(context);
        context.fillStyle = RevelareCanvas.BG_COLOR;
        context.fillRect(0, 0, RevelareCanvas.DIM_X, RevelareCanvas.DIM_Y);
        this.renderImage(context);

        let voronoiPolys = this.getVoronoiPolys();
        console.log(typeof voronoiPolys);
        this.printPolys(voronoiPolys, context);
    }

    getVoronoiPolys() {

        let delaunay = Delaunay.from(this.points);
        let voronoi = delaunay.voronoi([0, 0, 
                                            RevelareCanvas.DIM_X, RevelareCanvas.DIM_Y]);
        return voronoi.cellPolygons();

    }

    printPolys(voronoiPolys, context) {

        for(let polygon of voronoiPolys) {
            context.beginPath();
            context.globalAlpha = this.opacity;

            let fillColor = this.averageColors(polygon, context);
            context.fillStyle = fillColor;

            polygon.forEach(function(vertex) {
                context.lineTo(...vertex);
            });

            context.fill();
            context.globalAlpha = 1;
        }

    }

    averageColors(polygon, context) {

        let bounds = this.squareBounds(polygon);
        let smallReds, smallGreens, smallBlues;
        [smallReds, smallGreens, smallBlues] = this.submatrix(bounds);

        let polyReds = this.sumColorsBoundedByPolygon(polygon, bounds, smallReds);
        let polyGreens = this.sumColorsBoundedByPolygon(polygon, bounds, smallGreens);
        let polyBlues = this.sumColorsBoundedByPolygon(polygon, bounds, smallBlues);

        return d3.rgb(polyReds, polyGreens, polyBlues);

    }

    squareBounds(polygon) {

        let polyMinX = RevelareCanvas.DIM_X;
        let polyMinY = RevelareCanvas.DIM_Y;
        let polyMaxX = 0;
        let polyMaxY = 0;

        polygon.forEach((vertex) => {
        if (vertex[0] < polyMinX) {
            polyMinX = vertex[0];
            if (polyMinX < 0) {
                polyMinX = 0;
            }
        }
        if (vertex[0] > polyMaxX) {
            polyMaxX = vertex[0];
        }
        if (vertex[1] < polyMinY) {
            polyMinY = vertex[1];
            if (polyMinY < 0) {
                polyMinY = 0;
            }
        }
        if (vertex[1] > polyMaxY) {
            polyMaxY = vertex[1];
        }
        });

        return {
            xmin: polyMinX,
            xmax: polyMaxX,
            ymin: polyMinY,
            ymax: polyMaxY
        };

    }

    submatrix(bounds) {
        console.log("colorMap: ", this.colorMap);
        let relevantRedRows = this.relevantRows(bounds, this.colorMap.reds);
        let relevantGreenRows = this.relevantRows(bounds, this.colorMap.greens);
        let relevantBlueRows = this.relevantRows(bounds, this.colorMap.blues);
        return [relevantRedRows,relevantGreenRows,relevantBlueRows];
      }
    
    relevantRows(bounds, colorMapSingles) {
        console.log("colorMapSingles: ", colorMapSingles);
        let relevantColRows = colorMapSingles.slice(Math.floor(bounds.ymin), Math.floor(bounds.ymax));
        let relevantColors = relevantColRows.map((row) => {
            return row.slice(Math.floor(bounds.xmin), Math.floor(bounds.xmax));
        });
        return relevantColors;
    }

    sumColorsBoundedByPolygon(polygon, bounds, polyColors) {
        let boundedColorsSum = 0;
        let boundedCount = 0;
        polyColors.forEach((colorRow, rowIdxY) => {
            colorRow.forEach((colorEl, elIdxX) => {
                if (d3Poly.polygonContains(polygon, [bounds.xmin + elIdxX, bounds.ymin + rowIdxY])) {
                    boundedColorsSum += colorEl;
                    boundedCount++;
                }
            });
        });
        return Math.floor(boundedColorsSum / boundedCount);
    }

}

RevelareCanvas.BG_COLOR = "#000000";
RevelareCanvas.DIM_X = 1200;
RevelareCanvas.DIM_Y = 800;

export {RevelareCanvas};