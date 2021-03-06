/*global CSL: true */

CSL.NameOutput.prototype.renderAllNames = function () {

    // Note that et-al/ellipsis parameters are set on the basis
    // of rendering order through the whole cite.
    var pos;
    for (var i = 0, ilen = this.variables.length; i < ilen; i += 1) {
        var v = this.variables[i];
        pos = this.nameset_base + i;
        if (this.freeters[v].length) {
            this.freeters[v] = this._renderPersonalNames(this.freeters[v], pos);
        }
        for (var j = 0, jlen = this.institutions[v].length; j < jlen; j += 1) {
            this.persons[v][j] = this._renderPersonalNames(this.persons[v][j], pos, j);
        }
    }
    this.renderInstitutionNames();
};

CSL.NameOutput.prototype.renderInstitutionNames = function () {
    // Institutions are split to string list as
    // this.institutions[v]["long"] and this.institutions[v]["short"]
    for (var i = 0, ilen = this.variables.length; i < ilen; i += 1) {
        var v = this.variables[i];
        for (var j = 0, jlen = this.institutions[v].length; j < jlen; j += 1) {
            var institution, institution_short, institution_long, short_style, long_style;

            var name = this.institutions[v][j];

            // XXX Start here for institutions
            // Figure out the three segments: primary, secondary, tertiary
            var j, ret, optLangTag, jlen, key, localesets;
            if (this.state.tmp.extension) {
                localesets = ["sort"];
            } else if (name.isInstitution) {
                // Will never hit this in this function, but preserving
                // in case we factor this out.
                localesets = this.state.opt['cite-lang-prefs'].institutions;
            } else {
                localesets = this.state.opt['cite-lang-prefs'].persons;
            }

            slot = {primary:'locale-orig',secondary:false,tertiary:false};
	        if (localesets) {
		        var slotnames = ["primary", "secondary", "tertiary"];
		        for (var k = 0, klen = slotnames.length; k < klen; k += 1) {
			        if (localesets.length - 1 <  k) {
				        break;
			        }
                    if (localesets[k]) {
			            slot[slotnames[k]] = 'locale-' + localesets[k];
                    }
		        }
	        } else {
		        slot.primary = 'locale-translat';
	        }
	        if (this.state.tmp.area !== "bibliography"
		        && !(this.state.tmp.area === "citation"
			         && this.state.opt.xclass === "note"
			         && this.item && !this.item.position)) {
                
		        slot.secondary = false;
		        slot.tertiary = false;
	        }
            // Get normalized name object for a start.
            // true invokes fallback
            var res;
            this.setRenderedName(name);
            res = this.getName(name, slot.primary, true);
            var primary = res.name;
            var usedOrig = res.usedOrig;
            if (primary) {
                primary = this.fixupInstitution(primary, v, j);
            }

			secondary = false;
			if (slot.secondary) {
                res = this.getName(name, slot.secondary, false, usedOrig);
                secondary = res.name;
                usedOrig = res.usedOrig;
                if (secondary) {
				    secondary = this.fixupInstitution(secondary, v, j);
                }
			}
            //Zotero.debug("XXX [2] secondary: "+secondary["long"].literal+", slot.secondary: "+slot.secondary);
			tertiary = false;
			if (slot.tertiary) {
                res = this.getName(name, slot.tertiary, false, usedOrig);
                tertiary = res.name;
                if (tertiary) {
				    tertiary = this.fixupInstitution(tertiary, v, j);
                }
			}
            switch (this.institution.strings["institution-parts"]) {
            case "short":
                // No multilingual for pure short form institution names.
                if (primary["short"].length) {
                    short_style = this._getShortStyle();
                    institution = [this._renderOneInstitutionPart(primary["short"], short_style)];
                } else {
                    // Fail over to long.

                    long_style = this._getLongStyle(primary, v, j);
                    institution = [this._renderOneInstitutionPart(primary["long"], long_style)];
                }
                break;
            case "short-long":
                long_style = this._getLongStyle(primary, v, j);
                short_style = this._getShortStyle();
                institution_short = this._renderOneInstitutionPart(primary["short"], short_style);
                // true is to include multilingual supplement
                institution_long = this._composeOneInstitutionPart([primary, secondary, tertiary], slot, long_style);
                institution = [institution_short, institution_long];
                break;
            case "long-short":
                long_style = this._getLongStyle(primary, v, j);
                short_style = this._getShortStyle();
                institution_short = this._renderOneInstitutionPart(primary["short"], short_style);
                // true is to include multilingual supplement
                institution_long = this._composeOneInstitutionPart([primary, secondary, tertiary], slot, long_style, true);
                institution = [institution_long, institution_short];
                break;
            default:
                long_style = this._getLongStyle(primary, v, j);
                // true is to include multilingual supplement
                institution = [this._composeOneInstitutionPart([primary, secondary, tertiary], slot, long_style)];
                break;
            }
            this.institutions[v][j] = this._join(institution, "");
        }
    }
};

CSL.NameOutput.prototype._composeOneInstitutionPart = function (names, slot, style) {
    var primary = false, secondary = false, tertiary = false;
    if (names[0]) {
        primary = this._renderOneInstitutionPart(names[0]["long"], style);
    }
    if (names[1]) {
        secondary = this._renderOneInstitutionPart(names[1]["long"], style);
    }
    if (names[2]) {
        tertiary = this._renderOneInstitutionPart(names[2]["long"], style);
    }
    // Compose
    var institutionblob;
    if (secondary || tertiary) {
        this.state.output.openLevel("empty");

        this.state.output.append(primary);

        secondary_tok = CSL.Util.cloneToken(style);
        if (slot.secondary) {
            secondary_tok.strings.prefix = this.state.opt.citeAffixes.institutions[slot.secondary].prefix;
            secondary_tok.strings.suffix = this.state.opt.citeAffixes.institutions[slot.secondary].suffix;
            // Add a space if empty
            if (!secondary_tok.strings.prefix) {
                secondary_tok.strings.prefix = " ";
            }
        }
        this.state.output.append(secondary, secondary_tok);

        tertiary_tok = CSL.Util.cloneToken(style);
        if (slot.tertiary) {
            tertiary_tok.strings.prefix = this.state.opt.citeAffixes.institutions[slot.tertiary].prefix;
            tertiary_tok.strings.suffix = this.state.opt.citeAffixes.institutions[slot.tertiary].suffix;
            // Add a space if empty
            if (!tertiary_tok.strings.prefix) {
                tertiary_tok.strings.prefix = " ";
            }
        }
        this.state.output.append(tertiary, tertiary_tok);

        this.state.output.closeLevel();

        institutionblob = this.state.output.pop();
    } else {
        institutionblob = primary;
    }
    return institutionblob;
}

CSL.NameOutput.prototype._renderOneInstitutionPart = function (blobs, style) {
    for (var i = 0, ilen = blobs.length; i < ilen; i += 1) {
        if (blobs[i]) {
            var str = blobs[i];
            // XXXXX Cut-and-paste code in multiple locations. This code block should be
            // collected in a function.
            // Tag: strip-periods-block
            if (this.state.tmp.strip_periods) {
                str = str.replace(/\./g, "");
            } else {
                for (var j = 0, jlen = style.decorations.length; j < jlen; j += 1) {
                    if ("@strip-periods" === style.decorations[j][0] && "true" === style.decorations[j][1]) {
                        str = str.replace(/\./g, "");
                        break;
                    }
                }
            }
            //this.state.output.append(blobs[i], style, true);
            this.state.tmp.group_context.value()[2] = true;
            this.state.tmp.can_substitute.replace(false, CSL.LITERAL);
            if (str === "!here>>>") {
                blobs[i] = false;
            } else {
                this.state.output.append(str, style, true);
                blobs[i] = this.state.output.pop();
            }
        }
    }
    if ("undefined" === typeof this.institution.strings["part-separator"]) {
        this.institution.strings["part-separator"] = this.name.strings.delimiter;
    }
    return this._join(blobs, this.institution.strings["part-separator"]);
};

CSL.NameOutput.prototype._renderPersonalNames = function (values, pos, j) {
    //
    var ret = false;
    if (values.length) {
        var names = [];
        for (var i = 0, ilen = values.length; i < ilen; i += 1) {
            var name = values[i];
            
            // XXX We'll start here with attempts.
            // Figure out the three segments: primary, secondary, tertiary
            var ret, optLangTag, jlen, key, localesets;
            
            if (this.state.tmp.extension) {
                localesets = ["sort"];
            } else if (name.isInstitution) {
                // Will never hit this in this function, but preserving
                // in case we factor this out.
                localesets = this.state.opt['cite-lang-prefs'].institutions;
            } else {
                localesets = this.state.opt['cite-lang-prefs'].persons;
            }
            slot = {primary:'locale-orig',secondary:false,tertiary:false};
	        if (localesets) {
		        var slotnames = ["primary", "secondary", "tertiary"];
		        for (var k = 0, klen = slotnames.length; k < klen; k += 1) {
			        if (localesets.length - 1 <  k) {
				        break;
			        }
			        slot[slotnames[k]] = 'locale-' + localesets[k];
		        }
	        } else {
		        slot.primary = 'locale-translat';
	        }
	        if (this.state.tmp.sort_key_flag || (this.state.tmp.area !== "bibliography"
		        && !(this.state.tmp.area === "citation"
			         && this.state.opt.xclass === "note"
			         && this.item && !this.item.position))) {
                
		        slot.secondary = false;
		        slot.tertiary = false;
	        }

            // primary
            // true is for fallback
            this.setRenderedName(name);
            var res = this.getName(name, slot.primary, true);
            var primary = this._renderOnePersonalName(res.name, pos, i, j);
			secondary = false;
			if (slot.secondary) {
                res = this.getName(name, slot.secondary, false, res.usedOrig);
                if (res.name) {
				    secondary = this._renderOnePersonalName(res.name, pos, i, j);
                }
			}
			tertiary = false;
			if (slot.tertiary) {
                res = this.getName(name, slot.tertiary, false, res.usedOrig);
                if (res.name) {
				    tertiary = this._renderOnePersonalName(res.name, pos, i, j);
                }
			}
            // Now compose them to a unit
            var personblob;
            if (secondary || tertiary) {

                this.state.output.openLevel("empty");

                this.state.output.append(primary);

                secondary_tok = new CSL.Token();
                if (slot.secondary) {
                    secondary_tok.strings.prefix = this.state.opt.citeAffixes.persons[slot.secondary].prefix;
                    secondary_tok.strings.suffix = this.state.opt.citeAffixes.persons[slot.secondary].suffix;
                    // Add a space if empty
                    if (!secondary_tok.strings.prefix) {
                        secondary_tok.strings.prefix = " ";
                    }
                }
                this.state.output.append(secondary, secondary_tok);

                tertiary_tok = new CSL.Token();
                if (slot.tertiary) {
                    tertiary_tok.strings.prefix = this.state.opt.citeAffixes.persons[slot.tertiary].prefix;
                    tertiary_tok.strings.suffix = this.state.opt.citeAffixes.persons[slot.tertiary].suffix;
                    // Add a space if empty
                    if (!tertiary_tok.strings.prefix) {
                        tertiary_tok.strings.prefix = " ";
                    }
                }
                this.state.output.append(tertiary, tertiary_tok);

                this.state.output.closeLevel();

                personblob = this.state.output.pop();
            } else {
                personblob = primary;
            }
            names.push(personblob);
        }
        ret = this.joinPersons(names, pos, j);
    }
    return ret;
};

CSL.NameOutput.prototype._isRomanesque = function (name) {
    // 0 = entirely non-romanesque
    // 1 = mixed content
    // 2 = pure romanesque
    var ret = 2;
    if (!name.family.replace('"', '', 'g').match(CSL.ROMANESQUE_REGEXP)) {
        ret = 0;
    }
    if (!ret && name.given && name.given.match(CSL.STARTSWITH_ROMANESQUE_REGEXP)) {
        ret = 1;
    }
    if (ret == 2) {
        if (name.multi && name.multi.main) {
            var top_locale = name.multi.main.slice(0, 2);
        } else if (this.Item.language) {
            top_locale = this.Item.language.slice(0, 2);
        }
        if (["ja", "zh"].indexOf(top_locale) > -1) {
            ret = 1;
        }
    }
    //print("name: "+name.given+", multi: "+name.multi+", ret: "+ret);
    return ret;
};

CSL.NameOutput.prototype._renderOnePersonalName = function (value, pos, i, j) {
    var name = value;
    var dropping_particle = this._droppingParticle(name, pos, j);
    var family = this._familyName(name);
    var non_dropping_particle = this._nonDroppingParticle(name);
    var given = this._givenName(name, pos, i);
    var suffix = this._nameSuffix(name);
    if (this._isShort(pos, i) && !name["full-form-always"]) {
        dropping_particle = false;
        given = false;
        suffix = false;
    }
    var sort_sep = this.name.strings["sort-separator"];
    if (!sort_sep) {
        sort_sep = "";
    }
    var suffix_sep;
    if (name["comma-suffix"]) {
        suffix_sep = ", ";
    } else {
        suffix_sep = " ";
    }
    var romanesque = this._isRomanesque(name);
    var has_hyphenated_non_dropping_particle = non_dropping_particle && non_dropping_particle.blobs.slice(-1) === "-";
    var blob, merged, first, second;
    if (romanesque === 0) {
        // XXX handle affixes for given and family
        blob = this._join([non_dropping_particle, family, given], "");
    } else if (romanesque === 1 || name["static-ordering"]) { // entry likes sort order
        blob = this._join([non_dropping_particle, family, given], " ");
    } else if (name["reverse-ordering"]) { // entry likes reverse order
        blob = this._join([given, non_dropping_particle, family], " ");
    } else if (this.state.tmp.sort_key_flag) {
        // ok with no affixes here
        if (this.state.opt["demote-non-dropping-particle"] === "never") {
            first = this._join([non_dropping_particle, family, dropping_particle], " ");
            merged = this._join([first, given], " ");
            blob = this._join([merged, suffix], " ");
        } else {
            second = this._join([given, dropping_particle, non_dropping_particle], " ");
            merged = this._join([family, second], " ");
            blob = this._join([merged, suffix], " ");
        }
    } else if (this.name.strings["name-as-sort-order"] === "all" || (this.name.strings["name-as-sort-order"] === "first" && i === 0 && (j === 0 || "undefined" === typeof j))) {
        //
        // Discretionary sort ordering and inversions
        //
        if (["Lord", "Lady"].indexOf(name.given) > -1) {
            sort_sep = ", ";
        }
        if (["always", "display-and-sort"].indexOf(this.state.opt["demote-non-dropping-particle"]) > -1 && !has_hyphenated_non_dropping_particle) {
            // Drop non-dropping particle
            //second = this._join([given, dropping_particle, non_dropping_particle], " ");
            second = this._join([given, dropping_particle], (name["comma-dropping-particle"] + " "));
        
            // This would be a problem with al-Ghazali. Avoided by has_hyphenated_non_dropping_particle check above.
            second = this._join([second, non_dropping_particle], " ");
            if (second && this.given) {
                second.strings.prefix = this.given.strings.prefix;
                second.strings.suffix = this.given.strings.suffix;
            }
            if (family && this.family) {
                family.strings.prefix = this.family.strings.prefix;
                family.strings.suffix = this.family.strings.suffix;
            }
            merged = this._join([family, second], sort_sep);
            blob = this._join([merged, suffix], sort_sep);
        } else {
            // Don't drop particle.
            if (this.state.tmp.area === "bibliography" && !this.state.tmp.term_predecessor && non_dropping_particle) {
                if (!has_hyphenated_non_dropping_particle) {
                    non_dropping_particle.blobs = CSL.Output.Formatters["capitalize-first"](this.state, non_dropping_particle.blobs)
                }
            }
            if (has_hyphenated_non_dropping_particle) {
                first = this._join([non_dropping_particle, family], "");
            } else {
                first = this._join([non_dropping_particle, family], " ");
            }
            if (first && this.family) {
                first.strings.prefix = this.family.strings.prefix;
                first.strings.suffix = this.family.strings.suffix;
            }

            second = this._join([given, dropping_particle], (name["comma-dropping-particle"] + " "));
            //second = this._join([given, dropping_particle], " ");
            if (second && this.given) {
                second.strings.prefix = this.given.strings.prefix;
                second.strings.suffix = this.given.strings.suffix;
            }

            merged = this._join([first, second], sort_sep);
            blob = this._join([merged, suffix], sort_sep);
        }
    } else { // plain vanilla
        if (name["dropping-particle"] && name.family && !name["non-dropping-particle"]) {
            if (["'","\u02bc","\u2019"].indexOf(name["dropping-particle"].slice(-1)) > -1) {
                family = this._join([dropping_particle, family], "");
                dropping_particle = false;
            }
        }
        if (!this.state.tmp.term_predecessor) {
            if (!given && this.state.tmp.area === "bibliography") {
                if (!dropping_particle && non_dropping_particle) {
                    if (!has_hyphenated_non_dropping_particle) {
                        non_dropping_particle.blobs = CSL.Output.Formatters["capitalize-first"](this.state, non_dropping_particle.blobs)
                    }
                } else if (dropping_particle) {
                    dropping_particle.blobs = CSL.Output.Formatters["capitalize-first"](this.state, dropping_particle.blobs)
                }
            }
        }
        if (has_hyphenated_non_dropping_particle) {
            second = this._join([non_dropping_particle, family], "");
            second = this._join([dropping_particle, second], " ");
        } else {
            second = this._join([dropping_particle, non_dropping_particle, family], " ");
        }
        second = this._join([second, suffix], suffix_sep);
        if (second && this.family) {
            second.strings.prefix = this.family.strings.prefix;
            second.strings.suffix = this.family.strings.suffix;
        }
        if (given && this.given) {
            given.strings.prefix = this.given.strings.prefix;
            given.strings.suffix = this.given.strings.suffix;
        }
        if (second.strings.prefix) {
            name["comma-dropping-particle"] = "";
        }
        blob = this._join([given, second], (name["comma-dropping-particle"] + " "));
    }
    // XXX Just generally assume for the present that personal names render something
    this.state.tmp.group_context.value()[2] = true;
    this.state.tmp.can_substitute.replace(false, CSL.LITERAL);
    this.state.tmp.term_predecessor = true;
    // notSerious
    //this.state.output.append(blob, "literal", true);
    //var ret = this.state.output.pop();
    this.state.tmp.name_node.children.push(blob);
    return blob;
};

CSL.NameOutput.prototype._isShort = function (pos, i) {
    if (0 === this.state.tmp.disambig_settings.givens[pos][i]) {
        return true;
    } else {
        return false;
    }
};

/*
        // Do not include given name, dropping particle or suffix in strict short form of name

        // initialize if appropriate
*/

// Input names should be touched by _normalizeNameInput()
// exactly once: this is not idempotent.
CSL.NameOutput.prototype._normalizeNameInput = function (value) {
    var name = {
        literal:value.literal,
        family:value.family,
        isInstitution:value.isInstitution,
        given:value.given,
        suffix:value.suffix,
        "comma-suffix":value["comma-suffix"],
        "non-dropping-particle":value["non-dropping-particle"],
        "dropping-particle":value["dropping-particle"],
        "static-ordering":value["static-ordering"],
        "reverse-ordering":value["reverse-ordering"],
        "full-form-always": value["full-form-always"],
        "parse-names":value["parse-names"],
        "comma-dropping-particle": "",
        block_initialize:value.block_initialize,
        multi:value.multi
    };
    this._parseName(name);
    return name;
};

// _transformNameset() replaced with enhanced transform.name().

CSL.NameOutput.prototype._stripPeriods = function (tokname, str) {
    var decor_tok = this[tokname + "_decor"];
    if (str) {
        if (this.state.tmp.strip_periods) {
            str = str.replace(/\./g, "");
        } else  if (decor_tok) {
            for (var i = 0, ilen = decor_tok.decorations.length; i < ilen; i += 1) {
                if ("@strip-periods" === decor_tok.decorations[i][0] && "true" === decor_tok.decorations[i][1]) {
                    str = str.replace(/\./g, "");
                    break;
                }
            }
        }
    }
    return str;
};

CSL.NameOutput.prototype._nonDroppingParticle = function (name) {
    var ndp = name["non-dropping-particle"];
    if (ndp && this.state.tmp.sort_key_flag) {
        ndp = ndp.replace(/[\'\u2019]/, "");
    }
    var str = this._stripPeriods("family", ndp);
    if (this.state.output.append(str, this.family_decor, true)) {
        return this.state.output.pop();
    }
    return false;
};

CSL.NameOutput.prototype._droppingParticle = function (name, pos, j) {
    var dp = name["dropping-particle"];
    if (dp && this.state.tmp.sort_key_flag) {
        dp = dp.replace(/[\'\u2019]/, "");
    }
    var str = this._stripPeriods("given", dp);
    if (name["dropping-particle"] && name["dropping-particle"].match(/^et.?al[^a-z]$/)) {
        if (this.name.strings["et-al-use-last"]) {
            if ("undefined" === typeof j) { 
                this.etal_spec[pos].freeters = 2;
            } else {
                this.etal_spec[pos].persons = 2;
            }
        } else {
            if ("undefined" === typeof j) { 
                this.etal_spec[pos].freeters = 1;
            } else {
                this.etal_spec[pos].persons = 1;
            }
        }
        name["comma-dropping-particle"] = "";
    } else if (this.state.output.append(str, this.given_decor, true)) {
        return this.state.output.pop();
    }
    return false;
};

CSL.NameOutput.prototype._familyName = function (name) {
    var str = this._stripPeriods("family", name.family);
    if (this.state.output.append(str, this.family_decor, true)) {
        return this.state.output.pop();
    }
    return false;
};

CSL.NameOutput.prototype._givenName = function (name, pos, i) {

    if (this.name.strings.initialize === false) {
        if (name.family && name.given && this.name.strings.initialize === false) {
            name.given = CSL.Util.Names.initializeWith(this.state, name.given, this.name.strings["initialize-with"], true);
        }
        name.given = CSL.Util.Names.unInitialize(this.state, name.given);
    } else {
        if (name.family && 1 === this.state.tmp.disambig_settings.givens[pos][i] && !name.block_initialize) {
            var initialize_with = this.name.strings["initialize-with"];
            name.given = CSL.Util.Names.initializeWith(this.state, name.given, initialize_with);
        } else {
            name.given = CSL.Util.Names.unInitialize(this.state, name.given);
        }
    }

    var str = this._stripPeriods("given", name.given);
    var rendered = this.state.output.append(str, this.given_decor, true);
    if (rendered) {
        ret = this.state.output.pop();
	    return ret;
    }
    return false;
};

CSL.NameOutput.prototype._nameSuffix = function (name) {

    var str = name.suffix;

    if ("string" === typeof this.name.strings["initialize-with"]) {
        str = CSL.Util.Names.initializeWith(this.state, name.suffix, this.name.strings["initialize-with"], true);
    }

    str = this._stripPeriods("family", str);
    var toSuffix = '';
    if (str && str.slice(-1) === '.') {
	str = str.slice(0, -1);
	toSuffix = '.';
    }
    var rendered = this.state.output.append(str, "empty", true);
    if (rendered) {
        ret = this.state.output.pop();
	ret.strings.suffix = toSuffix + ret.strings.suffix;
	return ret;
    }
    return false;
};

CSL.NameOutput.prototype._getLongStyle = function (name, v, i) {
    var long_style, short_style;
    if (name["short"].length) {
        if (this.institutionpart["long-with-short"]) {
            long_style = this.institutionpart["long-with-short"];
        } else {
            long_style = this.institutionpart["long"];
        }
    } else {
        long_style = this.institutionpart["long"];
    }
    if (!long_style) {
        long_style = new CSL.Token();
    }
    return long_style;
};

CSL.NameOutput.prototype._getShortStyle = function () {
    var short_style;
    if (this.institutionpart["short"]) {
        short_style = this.institutionpart["short"];
    } else {
        short_style = new CSL.Token();
    }
    return short_style;
};

CSL.NameOutput.prototype._parseName = function (name) {
    var m, idx;
    if (!name["parse-names"] && "undefined" !== typeof name["parse-names"]) {
        return name;
    }
    if (name.family && !name.given && name.isInstitution) {
        name.literal = name.family;
        name.family = undefined;
        name.isInstitution = undefined;
    }
    var noparse;
    if (name.family 
        && (name.family.slice(0, 1) === '"' && name.family.slice(-1) === '"')
        || (!name["parse-names"] && "undefined" !== typeof name["parse-names"])) {

        name.family = name.family.slice(1, -1);
        noparse = true;
        name["parse-names"] = 0;
    } else {
        noparse = false;
    }
    if (!name["non-dropping-particle"] && name.family && !noparse && name.given) {
        m = name.family.match(/^((?:[\'\u2019a-z][ \'\u2019a-z]*[-\s\'\u2019]+|[ABDVL][^ ][-\s]+[a-z]*\s*|[ABDVL][^ ][^ ][-\s]+[a-z]*\s*))/);
        if (m) {
            name.family = name.family.slice(m[1].length);
            name["non-dropping-particle"] = m[1].replace(/\s+$/, "").replace("'", "\u2019");
        }
    }
    if (!name.suffix && name.given) {
        m = name.given.match(/(\s*,!*\s*)/);
        if (m) {
            idx = name.given.indexOf(m[1]);
            var possible_suffix = name.given.slice(idx + m[1].length);
            var possible_comma = name.given.slice(idx, idx + m[1].length).replace(/\s*/g, "");
            if (possible_suffix.length <= 3) {
                if (possible_comma.length === 2) {
                    name["comma-suffix"] = true;
                }
                name.suffix = possible_suffix;
            } else if (!name["dropping-particle"] && name.given) {
                name["dropping-particle"] = possible_suffix;
                name["comma-dropping-particle"] = ",";
            }
            name.given = name.given.slice(0, idx);
        }
    }
    if (!name["dropping-particle"] && name.given) {
        m = name.given.match(/(\s+)([a-z][ \'\u2019a-z]*)$/);
        if (m) {
            name.given = name.given.slice(0, (m[1].length + m[2].length) * -1);
            name["dropping-particle"] = m[2];
        }
    }
};

/*
 * Return a single name object
  */

// The interface is a mess, but this should serve.

CSL.NameOutput.prototype.getName = function (name, slotLocaleset, fallback, stopOrig) {

    // Needs to tell us whether we used orig or not.
    
    if (stopOrig && slotLocaleset === 'locale-orig') {
        return {name:false,usedOrig:stopOrig};
    }

    // Normalize to string
    if (!name.family) {
        name.family = "";
    }
    if (!name.given) {
        name.given = "";
    }

    // Recognized params are:
    //  block-initialize
    //  transliterated
    //  static-ordering
    //  full-form-always
    // All default to false, except for static-ordering, which is initialized
    // with a sniff.
    var name_params = {};
    // Determines the default static-order setting based on the characters
    // used in the headline field. Will be overridden by locale-based
    // parameters evaluated against explicit lang tags set on the (sub)field.
    name_params["static-ordering"] = this.getStaticOrder(name);

    var foundTag = true;
    if (slotLocaleset !== 'locale-orig') {
        foundTag = false;
        if (name.multi) {
            var langTags = this.state.opt[slotLocaleset]
            for (i = 0, ilen = langTags.length; i < ilen; i += 1) {
                langTag = langTags[i];
                if (name.multi._key[langTag]) {
                    foundTag = true;
                    name = name.multi._key[langTag];
                    // Set name formatting params
                    name_params = this.getNameParams(langTag);
                    name_params.transliterated = true;
                    break;
                }
            }
        }
    }

    if (!foundTag) {
        var langTag = false;
        if (name.multi && name.multi.main) {
            langTag = name.multi.main;
        } else if (this.Item.language) {
            langTag = this.Item.language;
        }
        if (langTag) {
            name_params = this.getNameParams(langTag);
        }
    }

    if (!fallback && !foundTag) {
        return {name:false,usedOrig:stopOrig};
    }
    
    // Normalize to string (again)
    if (!name.family) {
        name.family = "";
    }
    if (!name.given) {
        name.given = "";
    }
    
    // var clone the item before writing into it
    name = {
        family:name.family,
        given:name.given,
        "non-dropping-particle":name["non-dropping-particle"],
        "dropping-particle":name["dropping-particle"],
        suffix:name.suffix,
        "static-ordering":name_params["static-ordering"],
        "reverse-ordering":name_params["reverse-ordering"],
        "full-form-always": name_params["full-form-always"],
        "parse-names":name["parse-names"],
        "comma-suffix":name["comma-suffix"],
        "comma-dropping-particle":name["comma-dropping-particle"],
        transliterated: name_params.transliterated,
        block_initialize: name_params["block-initialize"],
        literal:name.literal,
        isInstitution:name.isInstitution,
        multi:name.multi
    };
    
    if (!name.literal && (!name.given && name.family && name.isInstitution)) {
        name.literal = name.family;
    }
    if (name.literal) {
        delete name.family;
        delete name.given;
    }
    name = this._normalizeNameInput(name);
    var usedOrig;
    if (stopOrig) {
        usedOrig = stopOrig;
    } else {
        usedOrig = !foundTag;
    }
    return {name:name,usedOrig:usedOrig};
}

CSL.NameOutput.prototype.getNameParams = function (langTag) {
    var ret = {};
    var langspec = CSL.localeResolve(this.Item.language, this.state.opt["default-locale"][0]);
    var try_locale = this.state.locale[langspec.best] ? langspec.best : this.state.opt["default-locale"][0];
    var name_as_sort_order = this.state.locale[try_locale].opts["name-as-sort-order"]
    var name_as_reverse_order = this.state.locale[try_locale].opts["name-as-reverse-order"]
    var name_never_short = this.state.locale[try_locale].opts["name-never-short"]
    var field_lang_bare = langTag.split("-")[0];
    if (name_as_sort_order && name_as_sort_order[field_lang_bare]) {
        ret["static-ordering"] = true;
        ret["reverse-ordering"] = false;
    }
    if (name_as_reverse_order && name_as_reverse_order[field_lang_bare]) {
        ret["reverse-ordering"] = true;
        ret["static-ordering"] = false;
    }
    if (name_never_short && name_never_short[field_lang_bare]) {
        ret["full-form-always"] = true;
    }
    
    if (ret["static-ordering"]) {
        ret["block-initialize"] = true;
    }
    return ret;
}

CSL.NameOutput.prototype.setRenderedName = function (name) {
    if (this.state.tmp.area === "bibliography") {
        var strname = "";
        for (var j=0,jlen=CSL.NAME_PARTS.length;j<jlen;j+=1) {
            if (name[CSL.NAME_PARTS[j]]) {
                strname += name[CSL.NAME_PARTS[j]];
            }
        }
        this.state.tmp.rendered_name.push(strname);
    }
}

CSL.NameOutput.prototype.fixupInstitution = function (name, varname, listpos) {

    name = this._splitInstitution(name, varname, listpos);
    // XXX This should be embedded in the institution name function.
    if (this.institution.strings["reverse-order"]) {
        name["long"].reverse();
    }
        
    var long_form = name["long"];
    var short_form = long_form.slice();
    if (this.state.sys.getAbbreviation) {
        var jurisdiction = this.Item.jurisdiction;
        for (var j = 0, jlen = long_form.length; j < jlen; j += 1) {
            jurisdiction = this.state.transform.loadAbbreviation(jurisdiction, "institution-part", long_form[j]);
            if (this.state.transform.abbrevs[jurisdiction]["institution-part"][long_form[j]]) {
                short_form[j] = this.state.transform.abbrevs[jurisdiction]["institution-part"][long_form[j]];
            }
        }
    }
    name["short"] = short_form;
    return name;
}


CSL.NameOutput.prototype.getStaticOrder = function (name, refresh) {
    var static_ordering_val = false;
    if (!refresh && name["static-ordering"]) {
        static_ordering_val = true;
    } else if (this._isRomanesque(name) === 0) {
        static_ordering_val = true;
    } else if ((!name.multi || !name.multi.main) && this.Item.language && ['vi', 'hu'].indexOf(this.Item.language) > -1) {
        static_ordering_val = true;
    } else if (name.multi && name.multi.main && ['vi', 'hu'].indexOf(name.multi.main.slice(0,2)) > -1) {
        static_ordering_val = true;
    } else {
        if (this.state.opt['auto-vietnamese-names']
            && (CSL.VIETNAMESE_NAMES.exec(name.family + " " + name.given)
                && CSL.VIETNAMESE_SPECIALS.exec(name.family + name.given))) {
            
            static_ordering_val = true;
        }
    }
    return static_ordering_val;
}


CSL.NameOutput.prototype._splitInstitution = function (value, v, i) {
    var ret = {};
    var splitInstitution = value.literal.replace(/\s*\|\s*/g, "|");
    // check for total and utter abbreviation IFF form="short"
    splitInstitution = splitInstitution.split("|");
    if (this.institution.strings.form === "short" && this.state.sys.getAbbreviation) {
        // On a match, drop unused elements to yield a single key.
        var jurisdiction = this.Item.jurisdiction;
        for (var j = splitInstitution.length; j > 0; j += -1) {
            var str = splitInstitution.slice(0, j).join("|");
            jurisdiction = this.state.transform.loadAbbreviation(jurisdiction, "institution-entire", str);
            if (this.state.transform.abbrevs[jurisdiction]["institution-entire"][str]) {
                var splitLst = this.state.transform.abbrevs[jurisdiction]["institution-entire"][str];

                splitLst = this.state.transform.quashCheck(splitLst);

                // If the abbreviation has date cut-offs, find the most recent
                // abbreviation within scope.
                var splitSplitLst = splitLst.split(/>>[0-9]{4}>>/);
                var m = splitLst.match(/>>([0-9]{4})>>/);
                splitLst = splitSplitLst.pop();
                if (splitSplitLst.length > 0 && this.Item["original-date"] && this.Item["original-date"].year) {
                    for (var k=m.length - 1; k > 0; k += -1) {
                        if (parseInt(this.Item["original-date"].year, 10) >= parseInt(m[k], 10)) {
                            break;
                        }
                        splitLst = splitSplitLst.pop();
                    }
                }
                splitLst = splitLst.replace(/\s*\|\s*/g, "|");
                splitInstitution = [splitLst];
            }
        }
    }
    splitInstitution.reverse();
    ret["long"] = this._trimInstitution(splitInstitution, v, i);
    return ret;
};

CSL.NameOutput.prototype._trimInstitution = function (subunits, v, i) {
	// 
    var use_first = false;
    var append_last = false;
    var stop_last = false;
    var s = subunits.slice();
    if (this.institution) {
        if ("undefined" !== typeof this.institution.strings["use-first"]) {
            use_first = this.institution.strings["use-first"];
        }
        if ("undefined" !== typeof this.institution.strings["stop-last"]) {
            // stop-last is negative when present
            s = s.slice(0, this.institution.strings["stop-last"]);
            subunits = subunits.slice(0, this.institution.strings["stop-last"]);
        }
        if ("undefined" !== typeof this.institution.strings["use-last"]) {
            append_last = this.institution.strings["use-last"];
        }
    }
    if (false === use_first) {
        if (this.persons[v].length === 0) {
            use_first = this.institution.strings["substitute-use-first"];
        }
        if (!use_first) {
            use_first = 0;
        }
    }
    if (false === append_last) {
        if (!use_first) {
            append_last = subunits.length;
        } else {
            append_last = 0;
        }
    }
    // Now that we've determined the value of append_last
    // (use-last), avoid overlaps.
    if (use_first > subunits.length - append_last) {
        use_first = subunits.length - append_last;
    }
    if (stop_last) {
        append_last = 0;
    }
    // This could be more clear. use-last takes priority
    // in the event of overlap, because of adjustment above
    subunits = subunits.slice(0, use_first);
    s = s.slice(use_first);
    if (append_last) {
        if (append_last > s.length) {
            append_last = s.length;
        }
        if (append_last) {
            subunits = subunits.concat(s.slice((s.length - append_last)));
        }
    }
    return subunits;
};
