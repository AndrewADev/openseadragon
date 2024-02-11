/*
 * OpenSeadragon - Tile
 *
 * Copyright (C) 2009 CodePlex Foundation
 * Copyright (C) 2010-2024 OpenSeadragon contributors
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 * - Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 *
 * - Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 *
 * - Neither the name of CodePlex Foundation nor the names of its
 *   contributors may be used to endorse or promote products derived from
 *   this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function( $ ){

/**
 * @class Tile
 * @memberof OpenSeadragon
 * @param {Number} level The zoom level this tile belongs to.
 * @param {Number} x The vector component 'x'.
 * @param {Number} y The vector component 'y'.
 * @param {OpenSeadragon.Rect} bounds Where this tile fits, in normalized
 *      coordinates.
 * @param {Boolean} exists Is this tile a part of a sparse image? ( Also has
 *      this tile failed to load? )
 * @param {String|Function} url The URL of this tile's image or a function that returns a url.
 * @param {CanvasRenderingContext2D} [context2D=undefined] The context2D of this tile if it
 *  *      is provided directly by the tile source. Deprecated: use Tile::addCache(...) instead.
 * @param {Boolean} loadWithAjax Whether this tile image should be loaded with an AJAX request .
 * @param {Object} ajaxHeaders The headers to send with this tile's AJAX request (if applicable).
 * @param {OpenSeadragon.Rect} sourceBounds The portion of the tile to use as the source of the
 *      drawing operation, in pixels. Note that this only works when drawing with canvas; when drawing
 *      with HTML the entire tile is always used.
 * @param {String} postData HTTP POST data (usually but not necessarily in k=v&k2=v2... form,
 *      see TileSource::getPostData) or null
 * @param {String} cacheKey key to act as a tile cache, must be unique for tiles with unique image data
 */
$.Tile = function(level, x, y, bounds, exists, url, context2D, loadWithAjax, ajaxHeaders, sourceBounds, postData, cacheKey) {
    /**
     * The zoom level this tile belongs to.
     * @member {Number} level
     * @memberof OpenSeadragon.Tile#
     */
    this.level   = level;
    /**
     * The vector component 'x'.
     * @member {Number} x
     * @memberof OpenSeadragon.Tile#
     */
    this.x       = x;
    /**
     * The vector component 'y'.
     * @member {Number} y
     * @memberof OpenSeadragon.Tile#
     */
    this.y       = y;
    /**
     * Where this tile fits, in normalized coordinates
     * @member {OpenSeadragon.Rect} bounds
     * @memberof OpenSeadragon.Tile#
     */
    this.bounds  = bounds;
    /**
     * Where this tile fits, in normalized coordinates, after positioning
     * @member {OpenSeadragon.Rect} positionedBounds
     * @memberof OpenSeadragon.Tile#
     */
    this.positionedBounds  = new OpenSeadragon.Rect(bounds.x, bounds.y, bounds.width, bounds.height);
    /**
     * The portion of the tile to use as the source of the drawing operation, in pixels. Note that
     * this only works when drawing with canvas; when drawing with HTML the entire tile is always used.
     * @member {OpenSeadragon.Rect} sourceBounds
     * @memberof OpenSeadragon.Tile#
     */
    this.sourceBounds = sourceBounds;
    /**
     * Is this tile a part of a sparse image? Also has this tile failed to load?
     * @member {Boolean} exists
     * @memberof OpenSeadragon.Tile#
     */
    this.exists  = exists;
    /**
     * Private property to hold string url or url retriever function.
     * Consumers should access via Tile.getUrl()
     * @private
     * @member {String|Function} url
     * @memberof OpenSeadragon.Tile#
     */
    this._url     = url;
    /**
     * Post parameters for this tile. For example, it can be an URL-encoded string
     * in k1=v1&k2=v2... format, or a JSON, or a FormData instance... or null if no POST request used
     * @member {String} postData HTTP POST data (usually but not necessarily in k=v&k2=v2... form,
     *      see TileSource::getPostData) or null
     * @memberof OpenSeadragon.Tile#
     */
    this.postData  = postData;
    /**
     * The context2D of this tile if it is provided directly by the tile source.
     * @member {CanvasRenderingContext2D} context2D
     * @memberOf OpenSeadragon.Tile#
     */
    if (context2D) {
        this.context2D = context2D;
    }
    /**
     * Whether to load this tile's image with an AJAX request.
     * @member {Boolean} loadWithAjax
     * @memberof OpenSeadragon.Tile#
     */
    this.loadWithAjax = loadWithAjax;
    /**
     * The headers to be used in requesting this tile's image.
     * Only used if loadWithAjax is set to true.
     * @member {Object} ajaxHeaders
     * @memberof OpenSeadragon.Tile#
     */
    this.ajaxHeaders = ajaxHeaders;

    if (cacheKey === undefined) {
        $.console.warn("Tile constructor needs 'cacheKey' variable: creation tile cache" +
            " in Tile class is deprecated. TileSource.prototype.getTileHashKey will be used.");
        cacheKey = $.TileSource.prototype.getTileHashKey(level, x, y, url, ajaxHeaders, postData);
    }

    this._cKey = cacheKey || "";
    this._ocKey = cacheKey || "";

    /**
     * Is this tile loaded?
     * @member {Boolean} loaded
     * @memberof OpenSeadragon.Tile#
     */
    this.loaded  = false;
    /**
     * Is this tile loading?
     * @member {Boolean} loading
     * @memberof OpenSeadragon.Tile#
     */
    this.loading = false;

    /**
     * The HTML div element for this tile
     * @member {Element} element
     * @memberof OpenSeadragon.Tile#
     */
    this.element    = null;
    /**
     * The HTML img element for this tile.
     * @member {Element} imgElement
     * @memberof OpenSeadragon.Tile#
     */
    this.imgElement = null;

    /**
     * The alias of this.element.style.
     * @member {String} style
     * @memberof OpenSeadragon.Tile#
     */
    this.style      = null;
    /**
     * This tile's position on screen, in pixels.
     * @member {OpenSeadragon.Point} position
     * @memberof OpenSeadragon.Tile#
     */
    this.position   = null;
    /**
     * This tile's size on screen, in pixels.
     * @member {OpenSeadragon.Point} size
     * @memberof OpenSeadragon.Tile#
     */
    this.size       = null;
    /**
     * Whether to flip the tile when rendering.
     * @member {Boolean} flipped
     * @memberof OpenSeadragon.Tile#
     */
    this.flipped    = false;
    /**
     * The start time of this tile's blending.
     * @member {Number} blendStart
     * @memberof OpenSeadragon.Tile#
     */
    this.blendStart = null;
    /**
     * The current opacity this tile should be.
     * @member {Number} opacity
     * @memberof OpenSeadragon.Tile#
     */
    this.opacity    = null;
    /**
     * The squared distance of this tile to the viewport center.
     * Use for comparing tiles.
     * @private
     * @member {Number} squaredDistance
     * @memberof OpenSeadragon.Tile#
     */
    this.squaredDistance   = null;
    /**
     * The visibility score of this tile.
     * @member {Number} visibility
     * @memberof OpenSeadragon.Tile#
     */
    this.visibility = null;

    /**
     * The transparency indicator of this tile.
     * @member {Boolean} hasTransparency true if tile contains transparency for correct rendering
     * @memberof OpenSeadragon.Tile#
     */
    this.hasTransparency = false;

    /**
     * Whether this tile is currently being drawn.
     * @member {Boolean} beingDrawn
     * @memberof OpenSeadragon.Tile#
     */
    this.beingDrawn     = false;

    /**
     * Timestamp the tile was last touched.
     * @member {Number} lastTouchTime
     * @memberof OpenSeadragon.Tile#
     */
    this.lastTouchTime  = 0;

    /**
     * Whether this tile is in the right-most column for its level.
     * @member {Boolean} isRightMost
     * @memberof OpenSeadragon.Tile#
     */
    this.isRightMost = false;

    /**
     * Whether this tile is in the bottom-most row for its level.
     * @member {Boolean} isBottomMost
     * @memberof OpenSeadragon.Tile#
     */
    this.isBottomMost = false;

    /**
     * Owner of this tile. Do not change this property manually.
     * @member {OpenSeadragon.TiledImage}
     * @memberof OpenSeadragon.Tile#
     */
    this.tiledImage = null;
    /**
     * Array of cached tile data associated with the tile.
     * @member {Object} _caches
     * @private
     */
    this._caches = {};
    /**
     * @private
     */
    this._cacheSize = 0;
};

/** @lends OpenSeadragon.Tile.prototype */
$.Tile.prototype = {

    /**
     * Provides a string representation of this tiles level and (x,y)
     * components.
     * @function
     * @returns {String}
     */
    toString: function() {
        return this.level + "/" + this.x + "_" + this.y;
    },

    /**
     * The unique main cache key for this tile. Created automatically
     *  from the given tiledImage.source.getTileHashKey(...) implementation.
     * @member {String} cacheKey
     * @memberof OpenSeadragon.Tile#
     */
    get cacheKey() {
        return this._cKey;
    },
    set cacheKey(value) {
        if (this._cKey !== value) {
            let ref = this._caches[this._cKey];
            if (ref) {
                // make sure we free drawer internal cache
                ref.destroyInternalCache();
            }
            this._cKey = value;
        }
    },

    /**
     * By default equal to tile.cacheKey, marks a cache associated with this tile
     * that holds the cache original data (it was loaded with). In case you
     * change the tile data, the tile original data should be left with the cache
     * 'originalCacheKey' and the new, modified data should be stored in cache 'cacheKey'.
     * This key is used in cache resolution: in case new tile data is requested, if
     * this cache key exists in the cache it is loaded.
     * @member {String} originalCacheKey
     * @memberof OpenSeadragon.Tile#
     */
    set originalCacheKey(value) {
        throw "Original Cache Key cannot be managed manually!";
    },
    get originalCacheKey() {
        return this._ocKey;
    },

    /**
     * The Image object for this tile.
     * @member {Object} image
     * @memberof OpenSeadragon.Tile#
     * @deprecated
     * @returns {Image}
     */
    get image() {
        $.console.error("[Tile.image] property has been deprecated. Use [Tile.getData] instead.");
        return this.getImage();
    },

    /**
     * The URL of this tile's image.
     * @member {String} url
     * @memberof OpenSeadragon.Tile#
     * @deprecated
     * @returns {String}
     */
    get url() {
        $.console.error("[Tile.url] property has been deprecated. Use [Tile.getUrl] instead.");
        return this.getUrl();
    },

    /**
     * Get the Image object for this tile.
     * @returns {?Image}
     */
    getImage: function() {
        $.console.error("[Tile.getImage] property has been deprecated. Use [Tile.getData] instead.");
        //this method used to ensure the underlying data model conformed to given type - convert instead of getData()
        const cache = this.getCache(this.cacheKey);
        if (!cache) {
            return undefined;
        }
        cache.transformTo("image");
        return cache.data;
    },

    /**
     * Get the url string for this tile.
     * @returns {String}
     */
    getUrl: function() {
        if (typeof this._url === 'function') {
            return this._url();
        }

        return this._url;
    },

    /**
     * Get the CanvasRenderingContext2D instance for tile image data drawn
     * onto Canvas if enabled and available
     * @returns {?CanvasRenderingContext2D}
     */
    getCanvasContext: function() {
        $.console.error("[Tile.getCanvasContext] property has been deprecated. Use [Tile.getData] instead.");
        //this method used to ensure the underlying data model conformed to given type - convert instead of getData()
        const cache = this.getCache(this.cacheKey);
        if (!cache) {
            return undefined;
        }
        cache.transformTo("context2d");
        return cache.data;
    },

    /**
     * The context2D of this tile if it is provided directly by the tile source.
     * @deprecated
     * @type {CanvasRenderingContext2D} context2D
     */
    get context2D() {
        $.console.error("[Tile.context2D] property has been deprecated. Use [Tile.getData] instead.");
        return this.getCanvasContext();
    },

    /**
     * The context2D of this tile if it is provided directly by the tile source.
     * @deprecated
     */
    set context2D(value) {
        $.console.error("[Tile.context2D] property has been deprecated. Use [Tile.setData] instead.");
        this.setData(value, "context2d");
    },

    /**
     * The default cache for this tile.
     * @deprecated
     * @type OpenSeadragon.CacheRecord
     */
    get cacheImageRecord() {
        $.console.error("[Tile.cacheImageRecord] property has been deprecated. Use Tile::getCache.");
        return this.getCache(this.cacheKey);
    },

    /**
     * The default cache for this tile.
     * @deprecated
     */
    set cacheImageRecord(value) {
        $.console.error("[Tile.cacheImageRecord] property has been deprecated. Use Tile::addCache.");
        const cache = this._caches[this.cacheKey];

        if (!value) {
            this.removeCache(this.cacheKey);
        } else {
            const _this = this;
            cache.await().then(x => _this.addCache(this.cacheKey, x, cache.type, false));
        }
    },

    /**
     * Get the data to render for this tile
     * @param {string} type data type to require
     * @param {boolean} [copy=true] whether to force copy retrieval
     * @return {*|undefined} data in the desired type, or undefined if a conversion is ongoing
     */
    getData: function(type, copy = true) {
        if (!this.tiledImage) {
            return null; //async can access outside its lifetime
        }

        //we return the data synchronously immediatelly (undefined if conversion happens)
        const cache = this.getCache(this.cacheKey);
        if (!cache) {
            $.console.error("[Tile::getData] There is no cache available for tile with key " + this.cacheKey);
            return undefined;
        }
        return cache.getDataAs(type, copy);
    },

    /**
     * Get the original data data for this tile
     * @param {string} type data type to require
     * @param {boolean} [copy=this.loaded] whether to force copy retrieval
     * @return {*|undefined} data in the desired type, or undefined if a conversion is ongoing
     */
    getOriginalData: function(type, copy = false) {
        if (!this.tiledImage) {
            return null; //async can access outside its lifetime
        }

        //we return the data synchronously immediatelly (undefined if conversion happens)
        const cache = this.getCache(this.originalCacheKey);
        if (!cache) {
            $.console.error("[Tile::getData] There is no cache available for tile with key " + this.originalCacheKey);
            return undefined;
        }
        return cache.getDataAs(type, copy);
    },

    /**
     * Set main cache data
     * @param {*} value
     * @param {?string} type data type to require
     * @param {boolean} [preserveOriginalData=true] if true and cacheKey === originalCacheKey,
     */
    setData: function(value, type, preserveOriginalData = true) {
        if (!this.tiledImage) {
            return null; //async can access outside its lifetime
        }

        if (preserveOriginalData && this.cacheKey === this.originalCacheKey) {
            //caches equality means we have only one cache:
            // change current pointer to a new cache and create it: new tiles will
            // not arrive at this data, but at originalCacheKey state
            // todo setting cache key makes the notification trigger ensure we do not do unnecessary stuff
            this.cacheKey = "mod://" + this.originalCacheKey;
            return this.addCache(this.cacheKey, value, type)._promise;
        }
        //else overwrite cache
        const cache = this.getCache(this.cacheKey);
        if (!cache) {
            $.console.error("[Tile::setData] There is no cache available for tile with key " + this.cacheKey);
            return $.Promise.resolve();
        }
        return cache.setDataAs(value, type);
    },

    /**
     * Read tile cache data object (CacheRecord)
     * @param {string} [key=this.cacheKey] cache key to read that belongs to this tile
     * @return {OpenSeadragon.CacheRecord}
     */
    getCache: function(key = this.cacheKey) {
        const cache = this._caches[key];
        if (cache) {
            cache.withTileReference(this);
        }
        return cache;
    },

    /**
     * Set tile cache, possibly multiple with custom key
     * @param {string} key cache key, must be unique (we recommend re-using this.cacheTile
     *   value and extend it with some another unique content, by default overrides the existing
     *   main cache used for drawing, if not existing.
     * @param {*} data data to cache - this data will be IGNORED if cache already exists!
     * @param {?string} type data type, will be guessed if not provided
     * @param [_safely=true] private
     * @returns {OpenSeadragon.CacheRecord|null} - The cache record the tile was attached to.
     */
    addCache: function(key, data, type = undefined, _safely = true) {
        if (!this.tiledImage) {
            return null; //async can access outside its lifetime
        }

        if (!type) {
            if (!this.tiledImage.__typeWarningReported) {
                $.console.warn(this, "[Tile.addCache] called without type specification. " +
                    "Automated deduction is potentially unsafe: prefer specification of data type explicitly.");
                this.tiledImage.__typeWarningReported = true;
            }
            type = $.convertor.guessType(data);
        }

        const writesToRenderingCache = key === this.cacheKey;
        if (writesToRenderingCache && _safely) {
            // Need to get the supported type for rendering out of the active drawer.
            const supportedTypes = this.tiledImage.viewer.drawer.getSupportedDataFormats();
            const conversion = $.convertor.getConversionPath(type, supportedTypes);
            $.console.assert(conversion, "[Tile.addCache] data was set for the default tile cache we are unable" +
                "to render. Make sure OpenSeadragon.convertor was taught to convert to (one of): " + type);
        }

        const cachedItem = this.tiledImage._tileCache.cacheTile({
            data: data,
            dataType: type,
            tile: this,
            cacheKey: key,
            //todo consider caching this on a tiled image level
            cutoff: this.__cutoff || this.tiledImage.source.getClosestLevel(),
        });
        const havingRecord = this._caches[key];
        if (havingRecord !== cachedItem) {
            if (!havingRecord) {
                this._cacheSize++;
            }
            this._caches[key] = cachedItem;
        }
        return cachedItem;
    },

    /**
     * Get the number of caches available to this tile
     * @returns {number} number of caches
     */
    getCacheSize: function() {
        return this._cacheSize;
    },

    /**
     * Free tile cache. Removes by default the cache record if no other tile uses it.
     * @param {string} key cache key, required
     * @param {boolean} [freeIfUnused=true] set to false if zombie should be created
     */
    removeCache: function(key, freeIfUnused = true) {
        if (this.cacheKey === key) {
            if (this.cacheKey !== this.originalCacheKey) {
                this.cacheKey = this.originalCacheKey;
            } else {
                $.console.warn("[Tile.removeCache] trying to remove the only cache that is used to draw the tile!");
            }
        }
        if (this.tiledImage._tileCache.unloadCacheForTile(this, key, freeIfUnused)) {
            //if we managed to free tile from record, we are sure we decreased cache count
            this._cacheSize--;
            delete this._caches[key];
        }
    },

    /**
     * Get the ratio between current and original size.
     * @function
     * @deprecated
     * @returns {number}
     */
    getScaleForEdgeSmoothing: function() {
        // getCanvasContext is deprecated and so should be this method.
        $.console.warn("[Tile.getScaleForEdgeSmoothing] is deprecated, the following error is the consequence:");
        const context = this.getCanvasContext();
        if (!context) {
            $.console.warn(
                '[Tile.drawCanvas] attempting to get tile scale %s when tile\'s not cached',
                this.toString());
            return 1;
        }
        return context.canvas.width / (this.size.x * $.pixelDensityRatio);
    },

    /**
     * Get a translation vector that when applied to the tile position produces integer coordinates.
     * Needed to avoid swimming and twitching.
     * @function
     * @param {Number} [scale=1] - Scale to be applied to position.
     * @returns {OpenSeadragon.Point}
     */
    getTranslationForEdgeSmoothing: function(scale, canvasSize, sketchCanvasSize) {
        // The translation vector must have positive values, otherwise the image goes a bit off
        // the sketch canvas to the top and left and we must use negative coordinates to repaint it
        // to the main canvas. In that case, some browsers throw:
        // INDEX_SIZE_ERR: DOM Exception 1: Index or size was negative, or greater than the allowed value.
        var x = Math.max(1, Math.ceil((sketchCanvasSize.x - canvasSize.x) / 2));
        var y = Math.max(1, Math.ceil((sketchCanvasSize.y - canvasSize.y) / 2));
        return new $.Point(x, y).minus(
            this.position
                .times($.pixelDensityRatio)
                .times(scale || 1)
                .apply(function(x) {
                    return x % 1;
                })
        );
    },

    /**
     * Removes tile from its container.
     * @function
     */
    unload: function() {
        //TODO AIOSA remove this.element and move it to a data constructor
        if ( this.imgElement && this.imgElement.parentNode ) {
            this.imgElement.parentNode.removeChild( this.imgElement );
        }
        if ( this.element && this.element.parentNode ) {
            this.element.parentNode.removeChild( this.element );
        }
        this.tiledImage = null;
        this._caches    = [];
        this._cacheSize = 0;
        this.element    = null;
        this.imgElement = null;
        this.loaded     = false;
        this.loading    = false;
        this._cKey      = this._ocKey;
    }
};

}( OpenSeadragon ));
