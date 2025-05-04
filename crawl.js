// First, import PlaywrightCrawler instead of CheerioCrawler
import dotenv from 'dotenv';
dotenv.config();
import { PlaywrightCrawler } from 'crawlee';

import fs from "fs";

import R2Handler from './r2handler.js';
import sendSlackNotification from './slack.js';
import sendDiscordNotification from './discord.js';

const { CLOUDFLARE_ACCOUNT_ID, ACCESS_KEY_ID, ACCESS_SECRET_KEY, R2_BUCKET, USER_EMAIL } = process.env
console.log(R2_BUCKET)

const SEEN_JOBS_FILE_R2 = `${USER_EMAIL}_SEEN_JOBS.json`;
const JOB_SEARCH_FILE = './files/JOB_SITES.json';
let all_new_jobs = {};
let all_seen_jobs = {};
let jobSearches = [];

const fileHandler = new R2Handler({ CLOUDFLARE_ACCOUNT_ID, ACCESS_KEY_ID, ACCESS_SECRET_KEY, R2_BUCKET });

// get sites to check
try {
  if (fs.existsSync(JOB_SEARCH_FILE)) {
    jobSearches = JSON.parse(fs.readFileSync(JOB_SEARCH_FILE));
  } 
}
catch(e) {
  console.log(e);
}

// get already seen jobs file
try {
  all_seen_jobs = await fileHandler.getJsonFromS3(SEEN_JOBS_FILE_R2);
  //all_seen_jobs = JSON.parse(all_seen_jobs);
  console.log(all_seen_jobs)
}
catch(e) {
  console.log(e);
}


const crawler = new PlaywrightCrawler({
    // Second, tell the browser to run with visible UI,
    // so that we can see what's going on.
    headless: true,
    // Third, replace $ with parseWithCheerio function.
    requestHandler: async ({ page, parseWithCheerio, request, enqueueLinks }) => {
        console.log(`Fetching URL: ${request.url}`);
        let pageurl = new URL(request.url);
        let baseurl = pageurl.origin.replace(/\/$/, '');
   
        let label = request.userData.title;
        let new_jobs = [];
        let seen_jobs = all_seen_jobs[label] ? all_seen_jobs[label] : [];
        console.log('---'+label);
        //console.log(seen_jobs);

        try {
          await page.waitForLoadState('networkidle');
        }
        catch (err) {
          console.warn(`Skipping ${request.url} due to error:`, err.message);
        }

        if(request.userData?.interactions) {
          let interactions = request.userData?.interactions;
          //for(let interact of interactions) {
          await Promise.all(interactions.map(async interact => {
            try {
              let type = interact?.type;
              switch (type) {
                case 'text':
                  await page.fill(interact?.selector, interact?.value.toString());
                  
                  break;
                case 'dropDown':
                  const dropDownList = page.locator(interact?.selector);
                  await dropDownList.selectOption(interact?.value.toString());
                  break;
              }
            }
            catch (e) {
              console.log(`An error occurred ${e}`);
            }
            
          }));
          
         
        }

        // Fourth, parse the browser's page with Cheerio.
        const $ = await parseWithCheerio();

        const exclusions = `:not([class*="filter"]):not([class*="share-link"]):not([class*="modal"]):not([class*="popup"]):not(nav *):not(footer *):not(header *):not([class*="modal"] *):not([class*="job-description"] *):not([class*="footer"] *):not([class*="menu"] *):not([class*="popup"] *):not([class*="privacy-policy"] *):not([role="alertdialog"] *):not([aria-modal="true"] *):not([aria-hidden="true"] *):not([style*="visibility: hidden"] *):not([aria-label="cookie-policy"]):not([aria-label="data-policy"]):not([aria-label="privacy-policy"])`;

        let jobs = $(`a[href*="job"]${exclusions}, 
          a[href*="career"]${exclusions}, 
          a[class*="job"][href]${exclusions}, 
          [class*="job-"]:not(body) a[href]${exclusions}, 
          [class*="jobs-"]:not(body) a[href]${exclusions}, 
          [class*="career"] a[href]${exclusions}, 
          [data-automation-id*="job"] a[href]${exclusions},
          [class*="search-results"] [role="button"][class*="position"]${exclusions},
          [class*="search-results"] [role="button"][class*="job"]${exclusions}`);
        

        for (let i=0; i< jobs.length; i++)
        {
          let job = $(jobs[i]); 
          let href = job.attr('href')?.toString().replace(/^\/+/, '') || ''; 
          let title = job.html().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/[\r\n]+/g, ' ').trim();
          if(title == 'Apply')
            title = job.attr('aria-label')?.toString();
          let id = `${href}${title}`;
          let link = (href.indexOf('http') != -1) ? href : `${baseurl}/${href}`;
          if(!Array.isArray(seen_jobs) || seen_jobs.find(j => j.id === id) === undefined){
            if(title && title.toString() != '' && id && id != '' && id != '#'){
              let job_obj = {
                id,
                title,
                link
              };
              new_jobs.push(job_obj);
              seen_jobs.push(job_obj);
            }
            
          }
        }
        console.log(new_jobs)
        if(new_jobs.length) {
          all_seen_jobs[label] = seen_jobs; //seen_jobs?.concat(new_jobs);
          all_new_jobs[label] = new_jobs;
        }

    }, //end request handler
});


await crawler.addRequests(jobSearches);

await crawler.run();

if(Object.keys(all_new_jobs).length){
  console.log(all_new_jobs)
  //console.log('true')
 sendSlackNotification(all_new_jobs);
 sendDiscordNotification(all_new_jobs);
}  


//await Dataset.exportToCSV('results');
fileHandler.uploadJSONFile(`${USER_EMAIL}_SEEN_JOBS.json`, JSON.stringify(all_seen_jobs))

//fs.writeFile(SEEN_JOBS_FILE_R2, JSON.stringify(all_seen_jobs), () => { console.log('SEEN file updated.')});

  

