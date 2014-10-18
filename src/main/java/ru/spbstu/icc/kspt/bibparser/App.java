package ru.spbstu.icc.kspt.bibparser;

import java.io.*;
import java.util.Map;

import org.jbibtex.*;

/**
 * Hello world!
 *
 */
public class App 
{
    public static void main( String[] args )
    {
    	String bibFile=args[0];
    	org.jbibtex.BibTeXParser bibtexParser=null;
    	org.jbibtex.BibTeXDatabase database=null;
    	try (Reader reader = new FileReader(bibFile);) {
			
    		bibtexParser = new org.jbibtex.BibTeXParser();
    		database = bibtexParser.parse(reader);
    		Map<Key, BibTeXEntry> entries = database.getEntries();
    		int k=0;
    		for(Key key : entries.keySet()){
    			BibTeXEntry entry = entries.get(key);
    			Map<Key, Value> fields  = entry.getFields();
    			System.out.println("------------------------------\n  Key     |           Value       ");
    			for(Key fieldKey : fields.keySet()){
    				Value value = fields.get(fieldKey);
    				System.out.println(String.format("%10.10s|%20.20s", fieldKey,value.toUserString()));
    			}
    		}
			
		} catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (TokenMgrException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (ParseException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}    	
    }
}
