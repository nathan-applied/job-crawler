// First, import PlaywrightCrawler instead of CheerioCrawler
import { PlaywrightCrawler, Dataset, launchPlaywright, playwrightUtils } from 'crawlee';
//import { launchPlaywright, playwrightUtils } from 'crawlee';
//const sendmail = require('sendmail')();
import  sendmail from 'sendmail';

const crawler = new PlaywrightCrawler({
    // Second, tell the browser to run with visible UI,
    // so that we can see what's going on.
    headless: true,
    // Third, replace $ with parseWithCheerio function.
    requestHandler: async ({ page, parseWithCheerio, request, enqueueLinks }) => {
        console.log(`Fetching URL: ${request.url}`);

        /*await page.waitForSelector('.search-results-enhanced-sort-criteria select');
        await page.click('.search-results-enhanced-sort-criteria select');

        await page.selectOption('.search-results-enhanced-sort-criteria select', '11');*/
console.log(request.selector)
        //if(request.dropDown.value > 0) {
           /* const dropDownList = page.locator('.search-results-enhanced-sort-criteria select');
            console.log(dropDownList)
            await dropDownList.selectOption("5");*/
           // console.log('here')
        //}

return
        if (request.label === 'start-url') {
            /*await enqueueLinks({
                selector: 'a',
            });
            return;*/
        }

       


        // Fourth, parse the browser's page with Cheerio.
        const $ = await parseWithCheerio();

        const title = $('a').text().trim();
        /*const vendor = $('a.product-meta__vendor').text().trim();
        const price = $('span.price').contents()[2].nodeValue;
        const reviewCount = parseInt($('span.rating__caption').text(), 10);
        const description = $('div[class*="description"] div.rte').text().trim();*/
 console.log(title)
        await Dataset.pushData({
            title,
            /*vendor,
            price,
            reviewCount,
            description,*/
        });
    },
});

await crawler.addRequests([{
    url: 'https://www.disneycareers.com/en/search-jobs?k=coordinator&l=Los+Angeles%2C+CA&orgIds=391', //'https://jobs.ashbyhq.com/wrapbook',
    userData: {
        label: 'start-url',
        selector: '.search-results-enhanced-sort-criteria select',
        value: 11,
        type: 'dropDown' //{ selector: '.search-results-enhanced-sort-criteria select', value: 5 }
    }
    
}]);

await crawler.run();


sendmail({
    from: 'nathan.turner1am@gmail.com',
    to: 'nathan.turner1am@gmail.com',
    subject: 'test sendmail',
    html: 'Mail of test sendmail ',
  }, function(err, reply) {
    console.log(err && err.stack);
});

//await Dataset.exportToCSV('results');

