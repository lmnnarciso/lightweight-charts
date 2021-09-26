"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var mocha_1 = require("mocha");
var date_formatter_1 = require("../../src/formatters/date-formatter");
var date_time_formatter_1 = require("../../src/formatters/date-time-formatter");
var percentage_formatter_1 = require("../../src/formatters/percentage-formatter");
var price_formatter_1 = require("../../src/formatters/price-formatter");
var time_formatter_1 = require("../../src/formatters/time-formatter");
var volume_formatter_1 = require("../../src/formatters/volume-formatter");
(0, mocha_1.describe)('Formatters', function () {
    (0, mocha_1.it)('date-formatter', function () {
        {
            var formatter = new date_formatter_1.DateFormatter();
            var d = new Date(1516147200000);
            var res = formatter.format(d);
            (0, chai_1.expect)(res).to.be.equal('2018-01-17');
        }
        {
            var formatter = new date_formatter_1.DateFormatter('dd-MM-yyyy');
            var d = new Date(1516147200000);
            var res = formatter.format(d);
            (0, chai_1.expect)(res).to.be.equal('17-01-2018');
        }
    });
    (0, mocha_1.it)('date-time-formatter', function () {
        var formatter = new date_time_formatter_1.DateTimeFormatter();
        var d = new Date(1538381512000);
        var res = formatter.format(d);
        (0, chai_1.expect)(res).to.be.equal('2018-10-01 08:11:52');
    });
    (0, mocha_1.it)('percent-formatter', function () {
        var formatter = new percentage_formatter_1.PercentageFormatter();
        var res = formatter.format(1.5);
        (0, chai_1.expect)(res).to.be.equal('1.50%');
    });
    (0, mocha_1.it)('price-formatter', function () {
        {
            var formatter = new price_formatter_1.PriceFormatter();
            var res = formatter.format(1.5);
            (0, chai_1.expect)(res).to.be.equal('1.50');
        }
        {
            var formatter = new price_formatter_1.PriceFormatter(1000);
            var res = formatter.format(1.5);
            (0, chai_1.expect)(res).to.be.equal('1.500');
        }
        {
            var formatter = new price_formatter_1.PriceFormatter(1000, 250);
            var res = formatter.format(1.6);
            (0, chai_1.expect)(res).to.be.equal('1.500');
        }
        {
            var formatter = new price_formatter_1.PriceFormatter();
            var res = formatter.format(-1.5);
            (0, chai_1.expect)(res).to.be.equal('\u22121.50');
        }
    });
    (0, mocha_1.it)('time-formatter', function () {
        {
            var formatter = new time_formatter_1.TimeFormatter();
            var d = new Date(1538381512000);
            var res = formatter.format(d);
            (0, chai_1.expect)(res).to.be.equal('08:11:52');
        }
        {
            var formatter = new time_formatter_1.TimeFormatter('%h-%m-%s');
            var d = new Date(1538381512000);
            var res = formatter.format(d);
            (0, chai_1.expect)(res).to.be.equal('08-11-52');
        }
    });
    (0, mocha_1.it)('volume-formatter', function () {
        var formatter = new volume_formatter_1.VolumeFormatter(3);
        (0, chai_1.expect)(formatter.format(1)).to.be.equal('1');
        (0, chai_1.expect)(formatter.format(10)).to.be.equal('10');
        (0, chai_1.expect)(formatter.format(100)).to.be.equal('100');
        (0, chai_1.expect)(formatter.format(1000)).to.be.equal('1K');
        (0, chai_1.expect)(formatter.format(5500)).to.be.equal('5.5K');
        (0, chai_1.expect)(formatter.format(1155000)).to.be.equal('1.155M');
    });
});
