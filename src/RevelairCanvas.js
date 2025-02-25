const d3Poly = require("d3-polygon");
const d3 = require("d3");
import {Delaunay} from "d3-delaunay";

class RevelairCanvas {
    constructor(context) {
        this.points = [];
        this.image = new Image();
        this.colorMap = {};
        this.song = [];
    }

    replaceImage(image, context) {
        this.clearCanvas(context);
        const newImage = new Image();
        newImage.src = image;

        newImage.onload = (event) => {
            this.image = newImage;
            this.renderImage(context);
            this.calculateColorMap(context);
            this.initialDraw(context);
        };
    }

    clearCanvas(context) {
        context.fillStyle = RevelairCanvas.BG_COLOR;
        context.fillRect(0, 0, RevelairCanvas.DIM_X, RevelairCanvas.DIM_Y);
    }

    renderImage(context) {
        context.drawImage(this.image, 0, 0, this.image.width, this.image.height,
                                        0, 0, RevelairCanvas.DIM_X, RevelairCanvas.DIM_Y);
    }

    calculateColorMap(context) {
        // https://roelhollander.eu/en/tuning-frequency/sound-light-colour/
        // http://designingsound.org/2017/12/20/mapping-sound-to-color/#sdendnote3sym
        let reds = [];
        let greens = [];
        let blues = [];
        let alpha = [];

        const colorMap = context.getImageData(0, 0, 
            RevelairCanvas.DIM_X, RevelairCanvas.DIM_Y);

        let colorfuls = [reds, greens, blues, alpha];
        for(let i = 0; i < colorMap.data.length; i++) {
            colorfuls[i%4].push(colorMap.data[i]);
        }

        let reds2d = [];
        let greens2d = [];
        let blues2d = [];

        for(let i = 0; i < RevelairCanvas.DIM_Y; i++) {

            reds2d.push(reds.splice(0, RevelairCanvas.DIM_X));
            greens2d.push(greens.splice(0, RevelairCanvas.DIM_X));
            blues2d.push(blues.splice(0, RevelairCanvas.DIM_X));

        }
        
        this.colorMap = {
            reds: reds2d,
            greens: greens2d,
            blues: blues2d
        };

    }

    addPoint(point) {
        this.points.push(point);
    }

    getPoints() {
        return this.points;
    }

    initialDraw(context) {
        let polygons = this.draw(context);
        console.log("polygons: ", polygons);
        this.song = this.generateSongFromColorsOfPolys(polygons, context);
        console.log("The song: ", this.song);
    }

    generateSongFromColorsOfPolys(polygons, context) {
        // have different numbers of notes depending on the hardness level that the player is playing at
        // have it go backwards in progress with each wrong note
        // user is basically guessing notes based on which colors they're seeing

        var notes = [];
        console.log("in generateSongFromColorsOfPolys");
        console.log("polygons: ", polygons);

        for(let polygon of polygons) {
            let rgb = this.averageColors(polygon, context);

            var color = "";
            var largestValue = 1;
            Object.keys(rgb).forEach((key, index) => {
                if(rgb[key] > largestValue) {
                    color = key;
                    largestValue = rgb[key];
                }
            });
            if(color == "r") {
                notes.push("E");
            } else if (color == "g") {
                notes.push("B");
            } else {
                notes.push("F");
            }

        }

        return notes;

    }

    draw(context) {
        this.clearCanvas(context);
        context.fillStyle = RevelairCanvas.BG_COLOR;
        context.fillRect(0, 0, RevelairCanvas.DIM_X, RevelairCanvas.DIM_Y);
        this.renderImage(context);

        let voronoiPolys = this.getVoronoiPolys();
        this.printPolys(voronoiPolys, context);
        return voronoiPolys;
    }

    getVoronoiPolys() {

        let delaunay = Delaunay.from(this.points);
        let voronoi = delaunay.voronoi([0, 0, 
                                            RevelairCanvas.DIM_X, RevelairCanvas.DIM_Y]);
        return Array.from(voronoi.cellPolygons());

    }

    printPolys(voronoiPolys, context) {

        for(let polygon of voronoiPolys) {
            context.beginPath();
            context.globalAlpha = this.opacity;

            let rgb = this.averageColors(polygon, context);
            context.fillStyle = rgb;

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

        let polyMinX = RevelairCanvas.DIM_X;
        let polyMinY = RevelairCanvas.DIM_Y;
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
        //console.log("colorMap: ", this.colorMap);
        let relevantRedRows = this.relevantRows(bounds, this.colorMap.reds);
        let relevantGreenRows = this.relevantRows(bounds, this.colorMap.greens);
        let relevantBlueRows = this.relevantRows(bounds, this.colorMap.blues);
        return [relevantRedRows,relevantGreenRows,relevantBlueRows];
      }
    
    relevantRows(bounds, colorMapSingles) {
        //console.log("colorMapSingles: ", colorMapSingles);
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

RevelairCanvas.BG_COLOR = "#000000";
RevelairCanvas.DIM_X = 600;
RevelairCanvas.DIM_Y = 400;

export {RevelairCanvas};