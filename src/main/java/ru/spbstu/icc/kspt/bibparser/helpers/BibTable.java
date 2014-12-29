package ru.spbstu.icc.kspt.bibparser.helpers;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.util.Map;

import javax.swing.JTable;
import javax.swing.ListSelectionModel;

import org.jbibtex.BibTeXDatabase;
import org.jbibtex.BibTeXEntry;
import org.jbibtex.BibTeXParser;
import org.jbibtex.Key;
import org.jbibtex.ParseException;

public class BibTable/* extends JTable*/ {
	private final static String[] columnNames = {"№", "Tag", "Name", "Authors"};
	Map<Key, BibTeXEntry> entries;
	JTable table;
	
	public BibTable(final File bibFile) throws FileNotFoundException, IOException, ParseException{
		table=fromBibToTable(bibFile);
		table.setSelectionMode(ListSelectionModel.MULTIPLE_INTERVAL_SELECTION);
	}
	
	Map<Key, BibTeXEntry> extractRecordsFromBib(File bibFile) throws FileNotFoundException, IOException, ParseException{
		
    	Map<Key, BibTeXEntry> entries=null;
    	try (Reader reader = new FileReader(bibFile);) {
        	BibTeXParser bibtexParser = new org.jbibtex.BibTeXParser();
        	BibTeXDatabase database = bibtexParser.parse(reader);
    		entries = database.getEntries();
    		reader.close();
		}
		return entries; 
	}
	
	public JTable getTable(){
		return table;
	}
		
	private JTable fromBibToTable(File bib) throws FileNotFoundException, IOException, ParseException{
		
		entries = extractRecordsFromBib(bib);
		String[][] tableEntries=new String[entries.size()][Constants.FIRST_TABLE_COLUMN_COUNT];
		Integer i=new Integer(0);
		entries.size();
		for(Key key : entries.keySet()){
			i++;
			String[] row=new String[Constants.FIRST_TABLE_COLUMN_COUNT];
			BibTeXEntry entry = entries.get(key);
			for(int k=0; k<Constants.FIRST_TABLE_COLUMN_COUNT; k++) {
				String column = Constants.FIRST_TABLE_COLUMN_NAMES[k];
				switch(column) {
				case "TAG":
					row[k]=entry.getKey().getValue();
					break;
				case "NUMBER":
					row[k]=i.toString();
					break;
				default:
					row[k]=entry.getField(new Key(column)).toUserString();
				}
			}
			tableEntries[i-1]=row;
		}
		return new JTable(tableEntries, columnNames);
	}
	
	public static void insertRow(){
		
	}
}
