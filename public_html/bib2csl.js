function convertJbib(jbib){
        var BibTexNames = {};
BibTexNames.Address = "address"; // Used
BibTexNames.Annote = "annote"; // Used
BibTexNames.Author = "author";  // Used
BibTexNames.BookTitle = "booktitle"; // Not sure about conversions from here
BibTexNames.Chapter = "chapter"; // Used
BibTexNames.CrossRef = "crossref";
BibTexNames.Edition = "edition"; // Used
BibTexNames.Editor = "editor"; // Used
BibTexNames.EPrint = "eprint";
BibTexNames.HowPublished = "howpublished";
BibTexNames.Institution = "institution";
BibTexNames.Journal = "journal";  // Used
BibTexNames.Key = "key"; // Not Applicable
BibTexNames.Month = "month"; // Used
BibTexNames.Note = "note"; // Used
BibTexNames.Number = "number"; // Used
BibTexNames.Organization = "organization"; // Used
BibTexNames.Pages = "pages"; // Used
BibTexNames.Publisher = "publisher"; // Used
BibTexNames.School = "school"; // Used
BibTexNames.Series = "series";
BibTexNames.Title = "title"; // Used
BibTexNames.Type = "type";
BibTexNames.URL = "url"; // Used
BibTexNames.Volume = "volume"; // Used
BibTexNames.Year = "year"; // Used

BibTexNames.Abstract = "abstract"; // Used
BibTexNames.Acmid = "acmid";
BibTexNames.Affiliation = "affiliation";
BibTexNames.Assignee = "assignee";
BibTexNames.BibSource = "bibsource"; // Used
BibTexNames.CiteSeeUrl = "citeseeurl";
BibTexNames.CiteULikeArticleId = "citeulike-article-id";
BibTexNames.Comment = "comment";
BibTexNames.Copyright = "copyright";
BibTexNames.Day = "day";
BibTexNames.DayFiled = "dayfiled";
BibTexNames.DOI = "doi"; // Used
BibTexNames.Editors = "Editors";
BibTexNames.File = "file";
BibTexNames.InterHash = "interhash";
BibTexNames.ISBN = "isbn"; // Used
BibTexNames.ISSN = "issn"; // Used
BibTexNames.Issue = "issue"; // Used
BibTexNames.IssueDate = "issue_date";
BibTexNames.Keyword = "keyword"; // Used
BibTexNames.Keywords = "keywords"; // Used
BibTexNames.Language = "language";
BibTexNames.Location = "location";
BibTexNames.MonthFiled = "monthfiled";
BibTexNames.Nationality = "nationality";
BibTexNames.NumPages = "numpages"; // Used
BibTexNames.OAI2Identifier = "oai2identifier";
BibTexNames.OptEditor = "opteditor";
BibTexNames.OptPages = "optpages";
BibTexNames.OptPublisher = "optpublisher";
BibTexNames.OptUrl = "opturl";
BibTexNames.OptVolume = "optVolume";
BibTexNames.Owner = "owner";
BibTexNames.PostedAt = "posted-at";
BibTexNames.Priority = "priority";
BibTexNames.PubMedID = "pubmedid";
BibTexNames.Review = "review";
BibTexNames.Site = "site";
BibTexNames.Size = "size"; // Used
BibTexNames.Timestamp = "timestamp";
BibTexNames.YearFiled = "yearfiled";
BibTexNames.Remark = "note";
BibTexNames.PDF = "pdf";
BibTexNames.ArchivePrefix = "archivePrefix";

// Added by Joeran
BibTexNames.Status = "status";
BibTexNames.Accessed = "accessed";
BibTexNames.ISBN13 = "isbn-13";
BibTexNames.Revision = "revision";


var CSLCategories = {};

CSLCategories.Anthropology = "anthropology";
CSLCategories.Astronomy = "astronomy";
CSLCategories.Biology = "biology";
CSLCategories.Botany = "botany";
CSLCategories.Chemistry = "chemistry";
CSLCategories.Communications = "communications";
CSLCategories.Engineering = "engineering";
CSLCategories.GenericBase = "generic-base";
CSLCategories.Geography = "geography";
CSLCategories.Geology = "geology";
CSLCategories.History = "history";
CSLCategories.Humanities = "humanities";
CSLCategories.Law = "law";
CSLCategories.Linguistics = "linguistics";
CSLCategories.Literature = "literature";
CSLCategories.Math = "math";
CSLCategories.Medicine = "medicine";
CSLCategories.Philosophy = "philosophy";
CSLCategories.Physics = "physics";
CSLCategories.PoliticalScience = "political_science";
CSLCategories.Psychology = "psycology";
CSLCategories.Science = "science";
CSLCategories.SocialScience = "social_science";
CSLCategories.Theology = "theology";
CSLCategories.Zoology = "zoology";
CSLCategories.InfoCategoriesExtension = "info-categories.extension";



var CSLNames = {};

// This is wrong!! Find something else!
CSLNames.Book = "book";

// Standard variables
CSLNames.Abstract = "abstract";
CSLNames.Annote = "annote";
CSLNames.Archive = "archive";
CSLNames.ArchiveLocation = "archive-location";
CSLNames.ArchivePlace = "archive-place";
CSLNames.Authority = "authority";
CSLNames.CallNumber = "call-number";
CSLNames.Categories = "categories";
CSLNames.CitationLabel = "citation-label";
CSLNames.CitationNumber = "citation-number";
CSLNames.CollectionTitle = "collection-title";
CSLNames.ContainerTitle = "container-title";
CSLNames.ContainerTitleShort = "container-title-short";
CSLNames.Dimensions = "dimensions";
CSLNames.DOI = "DOI"; // Digital Object Identifier
CSLNames.Event = "event";
CSLNames.EventPlace = "event-place";
CSLNames.Family = "family";
CSLNames.FirstReferenceNoteNumber = "first-reference-note-number";
CSLNames.Given = "given";
CSLNames.Genre = "genre";
CSLNames.ID = "id";
CSLNames.ISBN = "ISBN";
CSLNames.ISSN = "ISSN";
CSLNames.JournalAbbrevation = "journalAbbreviation";
CSLNames.Jurisdiction = "Jurisdiction";
CSLNames.Keyword = "keyword";
CSLNames.Language = "language";
CSLNames.Locator = "locator";
CSLNames.Medium = "medium";
CSLNames.Note = "note";
CSLNames.OriginalPublisher = "original-publisher";
CSLNames.OriginalPublisherPlace = "original-publisher-place";
CSLNames.OriginalTitle = "original-title";
CSLNames.Page = "page";
CSLNames.PageFirst = "page-first";
CSLNames.PMID = "PMID";
CSLNames.PMCID = "PMCID";
CSLNames.Publisher = "publisher";
CSLNames.PublisherPlace = "publisher-place";
CSLNames.References = "references";
CSLNames.Section = "section";
CSLNames.ShortTitle = "shortTitle";
CSLNames.Source = "source";
CSLNames.Status = "status";
CSLNames.Title = "title";
CSLNames.Type = "type";
//CSLNames.TitleShort = "title-short";
CSLNames.URL = "URL";
CSLNames.Version = "version";
CSLNames.YearSuffix = "year-suffix";

// Added from schema
CSLNames.DroppingParticle = "dropping-particle";
CSLNames.NonDroppingParticle = "non-dropping-particle";
CSLNames.Suffix = "suffix";
CSLNames.CommaSuffix = "comma-suffix";
CSLNames.StaticOrdering = "static-ordering";
CSLNames.Literal = "literal";
CSLNames.ParseNames = "parse-names";
CSLNames.DateParts = "date-parts";
CSLNames.Season = "season";
CSLNames.Circa = "circa";
CSLNames.Raw = "raw";


// Name variables
CSLNames.Author = "author";
CSLNames.CollectionEditor = "collection-editor";
CSLNames.Composer = "composer";
CSLNames.ContainerAuthor = "container-author";
CSLNames.Editor = "editor";
CSLNames.EditorialDirector = "editorial-director";
CSLNames.Illustrator = "illustrator";
CSLNames.Interviewer = "interviewer";
CSLNames.OriginalAuthor = "originalAuthor";
CSLNames.Recipient = "recipient";
CSLNames.Translator = "translator";

// Date variables
CSLNames.Accessed = "accessed";
CSLNames.Container = "container";
CSLNames.EventDate = "event-date";
CSLNames.Issued = "issued";
CSLNames.OriginalDate = "original-date";
CSLNames.Submitted = "submitted";

// Number variables
CSLNames.ChapterNumber = "chapter-number";
CSLNames.CollectionNumber = "collection-number";
CSLNames.Edition = "edition";
CSLNames.Issue = "issue";
CSLNames.Number = "number";
CSLNames.NumberOfPages = "number-of-pages";
CSLNames.NumberOfVolumes = "number-of-volumes";
CSLNames.Volume = "volume";

CSLNames.NameVariables = [CSLNames.Author,
    CSLNames.Editor,
    CSLNames.Translator,
    //Contributor,
    CSLNames.CollectionEditor,
    CSLNames.Composer,
    CSLNames.ContainerAuthor,
    CSLNames.EditorialDirector,
    CSLNames.Interviewer,
    CSLNames.OriginalAuthor,
    CSLNames.Recipient];

CSLNames.NumericVariables =
        [
            CSLNames.ChapterNumber,
            CSLNames.CollectionNumber,
            CSLNames.Edition,
            CSLNames.Issue,
            CSLNames.Locator,
            CSLNames.Number,
            CSLNames.NumberOfPages,
            CSLNames.NumberOfVolumes,
            CSLNames.Volume,
            CSLNames.CitationNumber
        ]

CSLNames.DateVariables =
        [
            //LocatorDate,
            CSLNames.Issued,
            CSLNames.EventDate,
            CSLNames.Accessed,
            CSLNames.Container,
            CSLNames.OriginalDate
        ]

CSLNames.MultiFieldVariables =
        [
            CSLNames.Publisher,
            CSLNames.PublisherPlace,
            CSLNames.EventPlace
        ]



var CSLTypes = {};

CSLTypes.Article = "article";
CSLTypes.ArticleJournal = "article-journal";
CSLTypes.ArticleMagazine = "article-magazine";
CSLTypes.ArticleNewspaper = "article-newspaper";
CSLTypes.Bill = "bill";
CSLTypes.Book = "book";
CSLTypes.Broadcast = "broadcast";
CSLTypes.Chapter = "chapter";
CSLTypes.Entry = "entry";
CSLTypes.EntryDictionary = "entry-dictionary";
CSLTypes.EntryEncyclopedia = "entry-encyclopedia";
CSLTypes.Figure = "entry-figure";
CSLTypes.Graphic = "graphic";
CSLTypes.Interview = "interview";
CSLTypes.LegalCase = "legal_case";
CSLTypes.Legislation = "legislation";
CSLTypes.Manuscript = "manuscript";
CSLTypes.Map = "map";
CSLTypes.MotionPicture = "motion_picture";
CSLTypes.MusicalScore = "musical_score";
CSLTypes.Pamphlet = "pamphlet";
CSLTypes.PaperConference = "paper-conference";
CSLTypes.Patent = "patent";
CSLTypes.PersonalCommunication = "personal_communication";
CSLTypes.Post = "post";
CSLTypes.PostWeblog = "post-weblog";
CSLTypes.Report = "report";
CSLTypes.Review = "review";
CSLTypes.ReviewBook = "review-book";
CSLTypes.Song = "song";
CSLTypes.Speech = "speech";
CSLTypes.Thesis = "thesis";
CSLTypes.Treaty = "treaty";
CSLTypes.WebPage = "webPage";




 
 var item = jbib;
 
 
 
 ApplyPagesTag();
 
 
 //ApplyNameTag(item.Author, BibTexNames.Author);
 
 ApplyTag(CSLNames.Annote, BibTexNames.Annote);
 
 ApplyTag(CSLNames.Edition, BibTexNames.Edition);
 
 ApplyTag(CSLNames.Abstract, BibTexNames.Abstract);
 
 ApplyTag(CSLNames.DOI, BibTexNames.DOI);
 
 ApplyTag(CSLNames.Note, BibTexNames.Note);
 
 ApplyTag(CSLNames.Volume, BibTexNames.Volume);
 
 ApplyTag(CSLNames.Keyword, BibTexNames.Keywords);
 
 ApplyTag(CSLNames.URL, BibTexNames.URL);
 
 ApplyTag(CSLNames.Status, BibTexNames.Status);
 
 ApplyTag(CSLNames.Accessed, BibTexNames.Accessed);
 
 ApplyTag(CSLNames.ISSN, BibTexNames.ISSN);
 
 ApplyTag(CSLNames.ISBN, BibTexNames.ISBN, BibTexNames.ISBN13);
 
 ApplyTag(CSLNames.Title, BibTexNames.Title, BibTexNames.Chapter);
 
 ApplyTag(CSLNames.ContainerTitle, BibTexNames.Journal, BibTexNames.BookTitle);
 
 ApplyTag(CSLNames.CollectionTitle, BibTexNames.Series);
 
 //ApplyNameTag(item.Editor, BibTexNames.Editor);
 
 switch (item.Type)
 {
 case CSLTypes.Report: // BibtexClassificationType.TechReport
 
 ApplyTag(CSLNames.Publisher, BibTexNames.Publisher, BibTexNames.Institution, BibTexNames.School, BibTexNames.Organization);
 break;
 
 case CSLTypes.Thesis:
 ApplyTag(CSLNames.Publisher, BibTexNames.Publisher, BibTexNames.School, BibTexNames.Institution, BibTexNames.Organization);
 break;
 
 default:
 ApplyTag(CSLNames.Publisher, BibTexNames.Publisher, BibTexNames.Organization, BibTexNames.Institution, BibTexNames.School);
 break;
 }
 
 ApplyTag(CSLNames.Version, BibTexNames.Revision);
 
 ApplyTag(CSLNames.Number, BibTexNames.Number);
 ApplyTag(CSLNames.Issue, BibTexNames.Issue);
 
 ApplyPagesTag();
 
 ApplyTag(CSLNames.PublisherPlace, BibTexNames.Location, BibTexNames.Address);
 
 // We don't support BibTexNames.IssuedDate yet
 ApplyDateTag();
 

 


















function ApplyTag(item)
{
    var found = false;


    /*for(var bibTexTagName in bibTexTagNames)
     {
     var tag = ExtractTag(bibTexTagName);
     if (found || tag == null) continue;
     
     Debug.Assert(tag != null);
     
     found = true;
     
     item.SetProperty(cslFieldName, tag.Display);
     }*/
    var bibTexTagNames = [];
    var bibTexTagName;
    if(Array.isArray(bibTexTagName)){ bibTexTagNames = bibTexTagName}
    else{bibTexTagNames.push(bibTexTagName)}


    for (var i = 0; i < bibTexTagNames.length; i++) {
        if (item.hasOwnProperty(bibTexTagNames[i])) {
            item[cslFieldName] = item[bibTexTagNames[i]];
            delete item[bibTexTagNames[i]];
        }

    }


}



function ApplyTagMulti( cslFieldNames, bibTexTagNames)
{
    /*var found = false;
     
     foreach(var bibTexTagName in bibTexTagNames)
     {
     var tag = ExtractTag(bibTexTagName);
     if (found || tag == null) continue;
     
     Debug.Assert(tag != null);
     
     found = true;
     
     foreach (var cslFieldName in cslFieldNames)
     {
     item.SetProperty(cslFieldName, tag.Display);
     }
     }*/

    var found = false;
    for (var bibTexTagName in bibTexTagNames) {

        var tag = item[bibTexTagName];
        delete item[bibTexTagNames];
        if (found || tag == null)
            continue;

        found = true;
        for (var cslFieldName in cslFieldNames)
        {
            item[cslFieldName] = tag;

        }


    }



}







function  ApplyPagesTag()
{

    ApplyTag(CSLNames.NumberOfPages, BibTexNames.NumPages);

    var pagesTag = item[BibTexNames.Pages];
    delete item[BibTexNames.Pages];;
    if (pagesTag == null)
        return;

    var parser =  PageRangeParser(pagesTag, item.NumberOfPages);
//Debug.WriteLine(parser.ToString());

    if (parser.Page != null)
        item.Page = parser.Page;
    if (parser.PageFirst != null)
        item.PageFirst = parser.PageFirst;
    if (parser.NumberOfPages != null)
        item.NumberOfPages = parser.NumberOfPages;
}





function  PageRangeParser(originalPages, originalNumPages)
{
    var Parser = /(\d+)(?:\s*[-–]{1,2}\s*(\d+)\s*(?:\(\d+\))?)?/;
    ;

    // Assume no match so we can return quickly
    var page = originalPages;
    var numberOfPages = originalNumPages;
    if (originalPages == null)
        return null;
    var matches;
   matches = Parser.exec(page) ;

    // Only parse for exactly one match
    if (matches.length <= 1)
        return null; 



    // Get the first page (quick return if not valid)
    
    var firstPage = matches[1];
    var secondPage = matches[2];
    
    var numOfPages = secondPage-firstPage;
    var page;
    if(firstPage!= null&& secondPage!= null &&numOfPages!= null){
        page = "{0}-{1} ({2})".format(firstPage, secondPage, numberOfPages);
    }

    
    
    return page = {Page:page,PageFirst:firstPage, NumberOfPages:numOfPages  };
 
 

}





function ApplyDateTag()
{
    var found = false;
    var dateparts = [];

                                var yearString = item[BibTexNames.Year] ;
				var monthString = item[BibTexNames.Month];
				var dayString = item[BibTexNames.Day];
    /*for(var bibTexTagName in bibTexTagNames)
     {
     var tag = ExtractTag(bibTexTagName);
     if (found || tag == null) continue;
     
     Debug.Assert(tag != null);
     
     found = true;
     
     item.SetProperty(cslFieldName, tag.Display);
     }*/
 if (yearString!=null ){
     
     dateparts.push(yearString);
    if (monthString!=null ){
     
     dateparts.push(monthString);
    if (dayString!=null ){
     
     dateparts.push(dayString);
     
     
 }
     
 }
     
 }
 item.issued = {};
 item.issued["date-parts"] = [];
  item.issued["date-parts"].push( dateparts);
            delete item[BibTexNames.Year];
    delete item[BibTexNames.Month];    
delete item[BibTexNames.Day];
}

}











