package ru.spbstu.icc.kspt.bibparser.combinations;

public class Combination {
	private String combinedString;
	
	public Combination(String combinedString) {
		this.combinedString = combinedString;
	}
	
	@Override
	public String toString() {
		return combinedString;
	}
	
	public void setCombination(String combinedString){
		this.combinedString = combinedString;
	}
	
	public String getCombination(){
		return combinedString;
	}
}
