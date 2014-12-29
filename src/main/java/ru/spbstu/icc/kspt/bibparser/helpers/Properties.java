package ru.spbstu.icc.kspt.bibparser.helpers;

import java.io.File;
import java.util.List;

import org.jbibtex.Key;

public class Properties {
	
	private File bib;
	private File style;
	private List<Key> selected;

	public File getBib() {
		return bib;
	}

	public void setBib(File bib) {
		this.bib = bib;
	}

	public File getStyle() {
		return style;
	}

	public void setStyle(File style) {
		this.style = style;
	}

	public List<Key> getSelected() {
		return selected;
	}

	public void setSelected(List<Key> selected) {
		this.selected = selected;
	}
}
