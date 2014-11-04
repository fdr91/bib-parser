package ru.spbstu.icc.kspt.bibparser.gui;

import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JMenu;
import javax.swing.JMenuBar;
import javax.swing.JMenuItem;

public class MultyWindowFrame  extends JFrame {
	
	/**
	 * 
	 */
	private static final long serialVersionUID = 2L;
	@SuppressWarnings("unused")
	JButton nextFrameButton;
	@SuppressWarnings("unused")
	JButton previousFrameButton;
	private static JMenuBar mainMenu;
	private static JMenu mnFile;

	
	MultyWindowFrame(JButton prev, JButton next){
		nextFrameButton=next;
		previousFrameButton = prev;
		initial();		
	}
	
	private void initial(){
		
		setTitle("Green Team project");
		setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		setBounds(100, 100, 526, 405);
		if(mainMenu==null) {
			mainMenu = new JMenuBar();
			
	
			mnFile = new JMenu("File");
			mainMenu.add(mnFile);
	
			JMenuItem mntmNewMenuItem = new JMenuItem("Open");
			mnFile.add(mntmNewMenuItem);
	
			JMenuItem mntmNewMenuItem_1 = new JMenuItem("Exit");
			mnFile.add(mntmNewMenuItem_1);
		}
		setJMenuBar(mainMenu);
	}
	
}
