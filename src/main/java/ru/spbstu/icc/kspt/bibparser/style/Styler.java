package ru.spbstu.icc.kspt.bibparser.style;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.List;

import org.jbibtex.BibTeXDatabase;
import org.jbibtex.Key;
import org.jbibtex.ParseException;

import de.undercouch.citeproc.CSL;
import de.undercouch.citeproc.bibtex.BibTeXConverter;
import de.undercouch.citeproc.bibtex.BibTeXItemDataProvider;
import de.undercouch.citeproc.output.Bibliography;

public class Styler {
		
	public static String process(File bib, String style, List<Key> tags) throws FileNotFoundException, IOException, ParseException{
		/** 1 */
		BibTeXDatabase db = new BibTeXConverter().loadDatabase(
			    new FileInputStream(bib));
		/** 2 */
		BibTeXItemDataProvider provider = new BibTeXItemDataProvider();
		provider.addDatabase(db);
		
		CSL citeproc = new CSL(provider, style);
		citeproc.setOutputFormat("html");
		
		for(Key tag : tags)
			citeproc.makeCitation(tag.toString());
		
		/** 5*/
		Bibliography bibl = citeproc.makeBibliography();
		
		String retval="";
		
		for(String entr : bibl.getEntries())
			retval+=entr;		
		return retval;
	}
}
