package ru.spbstu.icc.kspt.bibparser.gui;

import java.awt.*;
import java.awt.event.*;
import java.io.File;
import javax.swing.*;

public class GUI extends JFrame {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	JTextField textParam;
	String[] param = {"по автору","по названию","по году", "по индексу"};
		
	public GUI(String str){
		super(str);
		setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		setResizable(false);
	   
		// screen size
		Dimension sSize = Toolkit.getDefaultToolkit ().getScreenSize ();
		int vert = sSize.height;
		int hor  = sSize.width;
		vert = (vert/3)-200;
		hor = (hor/3)-165;
		
		// font
		Font font = new Font("Verdana", Font.PLAIN, 12);
		final JTabbedPane tabbedPane = new JTabbedPane();
		tabbedPane.setFont(font);
		
		// tabs
		JPanel tab_panel_project = new JPanel();
		JPanel tab_panel_bib = new JPanel();
		JPanel tab_panel_style = new JPanel();
		
		// Layout manager
		tab_panel_project.setLayout(new GridLayout(1,3));
		tab_panel_bib.setLayout(new GridLayout(1,3));
		tab_panel_style.setLayout(new GridLayout(1,3));
		
		// adding tabs
		tabbedPane.addTab("Последние проекты", tab_panel_project);
		tabbedPane.addTab("Выбор литературы", tab_panel_bib);
		tabbedPane.addTab("Выбор стиля", tab_panel_style);
			
		// tab 1 **********************************************************************************************
		
		// container
		JPanel tab1_container = new JPanel();
		tab1_container.setLayout(new FlowLayout(FlowLayout.LEFT, 30,20));
		
		// label "Структура"
		JLabel label9 = new JLabel("Структура");
		label9.setPreferredSize(new Dimension(400,23));
		tab1_container.add(label9);
		
		// label "Последние созданные проекты"
		JLabel label10 = new JLabel("Последние созданные проекты");
		label10.setPreferredSize(new Dimension(350,23));
		tab1_container.add(label10);
		
		// text area "Структура"
		JTextArea overview = new JTextArea(8,5);
		JScrollPane overview_scroll=new JScrollPane(overview);
		overview_scroll.setPreferredSize(new Dimension(400,450));
		tab1_container.add(overview_scroll);
		
		// text area "Последние созданные проекты"
		JTextArea last_projects = new JTextArea(8,5);
		JScrollPane last_projects_scroll=new JScrollPane(last_projects);
		last_projects_scroll.setPreferredSize(new Dimension(400,450));
		tab1_container.add(last_projects_scroll);
		
		// tab label
		JLabel tab_label = new JLabel();
		tab_label.setPreferredSize(new Dimension(635,25));
		tab1_container.add(tab_label);
		
		//кнопка "Создать новый проект"
		JButton newProject = new JButton("Создать новый проект");
		tab1_container.add(newProject);
		newProject.addActionListener(new ActionListener(){
			public void actionPerformed(ActionEvent e) {
				tabbedPane.setSelectedIndex(1);				
			}
			
		});
		
		tab_panel_project.add(tab1_container);
	
		// TAB 2**********************************************************************************************
		
		// Block 1
		
		// Container
		JPanel tab2_container= new JPanel();
		tab2_container.setLayout(new FlowLayout(FlowLayout.LEFT, 10,10));
		
		// label "Путь к bib-файлу"
		JLabel label1 = new JLabel("Путь к bib-файлу");
		label1.setPreferredSize(new Dimension(200,25));
		tab2_container.add(label1);
		
		// text field "Введите путь..."
		final JTextField text_path = new JTextField("Введите путь...");
		text_path.setPreferredSize(new Dimension(800,25));
		tab2_container.add(text_path);
		text_path.addMouseListener(new MouseAdapter(){
			public void mouseClicked(MouseEvent e) {
				text_path.setText("");
			}
		});	
		
		// search button
		JButton bib_search = new JButton("...");
		tab2_container.add(bib_search);
		bib_search.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) {
            	  JFileChooser fileopen = new JFileChooser();             
            	int ret = fileopen.showDialog(null, "Открыть файл");
            	if (ret == JFileChooser.APPROVE_OPTION) {
            	    File file = fileopen.getSelectedFile();
            	     /*
            	     * загрузка bib-файла.
            	     */
            	    }
            	}
            });
		
		
		// label "ПОИСК"
		JLabel label2 = new JLabel("ПОИСК");
		label2.setPreferredSize(new Dimension(800,25));
		tab2_container.add(label2);
		
		// search parameters
		final JComboBox<String> paramSearch = new JComboBox<>(param);
		paramSearch.setPreferredSize(new Dimension(850,25));
		tab2_container.add(paramSearch);
		paramSearch.addItemListener(new ItemListener(){
			public void itemStateChanged(ItemEvent e) {
				if (paramSearch.getSelectedIndex()==0)
					textParam.setText("выбрана вкладка "+ paramSearch.getSelectedIndex());
				else if (paramSearch.getSelectedIndex()==1)
					textParam.setText("выбрана вкладка "+ paramSearch.getSelectedIndex());
				else if (paramSearch.getSelectedIndex()==2)
					textParam.setText("выбрана вкладка "+ paramSearch.getSelectedIndex());
				else if (paramSearch.getSelectedIndex()==3)
					textParam.setText("выбрана вкладка "+ paramSearch.getSelectedIndex());
			}
			
		});
		
		// text field "Введите значение..."
		textParam = new JTextField("Введите значение...");
		textParam.setPreferredSize(new Dimension(770,25));
		tab2_container.add(textParam);
		textParam.addMouseListener(new MouseAdapter(){
			public void mouseClicked(MouseEvent e) {
				textParam.setText("");
			}
		});	
		
		// button "НАЙТИ"
		JButton search = new JButton("НАЙТИ");
		tab2_container.add(search);
		
		// Block 2	

		// label "bib-файл"
		JLabel label3 = new JLabel("bib-файл");
		label3.setPreferredSize(new Dimension(470,23));
		tab2_container.add(label3);
		
		// label "Выбранная литература"
		JLabel label4 = new JLabel("Выбранная литература");
		label4.setPreferredSize(new Dimension(300,23));
		tab2_container.add(label4);
				
		// text area "bib-файл"
		JTextArea bibText = new JTextArea(8,5);
		JScrollPane bibscroll=new JScrollPane(bibText);
		bibscroll.setPreferredSize(new Dimension(375,300));
		tab2_container.add(bibscroll);
	   
		// button container
		JPanel panel33 = new JPanel();
		panel33.setLayout(new BorderLayout(25,25));
		JButton add = new JButton(">>>");
		JButton del = new JButton("<<<");
		JButton clear = new JButton("Очистить");
		panel33.add(add, BorderLayout.NORTH);
		panel33.add(del, BorderLayout.CENTER);
		panel33.add(clear, BorderLayout.SOUTH);
		tab2_container.add(panel33);
		
		// text area "Выбранная литература"
		JTextArea liter = new JTextArea(8,5);
		JScrollPane literscroll=new JScrollPane(liter);
		literscroll.setPreferredSize(new Dimension(375,300));
		tab2_container.add(literscroll);
		
		// tab label
		JLabel label5 = new JLabel();
		label5.setPreferredSize(new Dimension(770,25));
		tab2_container.add(label5);
		
		// button "Далее"
		JButton next = new JButton("Далее");
		tab2_container.add(next);
		next.addActionListener(new ActionListener(){
			public void actionPerformed(ActionEvent e) {
				tabbedPane.setSelectedIndex(2);				
			}
			
		});
		
		tab_panel_bib.add(tab2_container);
		
		//ВКЛАДКА 3**********************************************************************************************
		
		//контейнер
		JPanel tab3_container = new JPanel();
		tab3_container.setLayout(new FlowLayout(FlowLayout.LEFT, 30,20));
		
		//метка "Список литературы"
		JLabel label6 = new JLabel("Список литературы");
		label6.setPreferredSize(new Dimension(400,23));
		
		//метка "Выбор стиля оформления"
		tab3_container.add(label6);
		JLabel label7 = new JLabel("Выбор стиля оформления");
		label7.setPreferredSize(new Dimension(350,23));
		tab3_container.add(label7);
		
		// текстовая область "Список литературы"
		JTextArea liter2 = new JTextArea(8,5);
		//liter2.setPreferredSize(new Dimension(400,450));
		JScrollPane liter2scroll=new JScrollPane(liter2);
		liter2scroll.setPreferredSize(new Dimension(400,450));
		tab3_container.add(liter2scroll);
		
		//// текстовая область "Выбор стиля оформления"
		JTextArea stil = new JTextArea(8,5);
		//stil.setPreferredSize(new Dimension(400,450));
		JScrollPane stilscroll=new JScrollPane(stil);
		stilscroll.setPreferredSize(new Dimension(400,450));
		tab3_container.add(stilscroll);
		
		//метка-отступ
		JLabel label8 = new JLabel();
		label8.setPreferredSize(new Dimension(400,25));
		tab3_container.add(label8);
		
		//кнопка "Просмотр"
		JButton preview = new JButton("Просмотр");
		tab3_container.add(preview);
		
		//кнопка "Добавить другие стили"
		JButton addStyle = new JButton("Добавить другие стили");
		tab3_container.add(addStyle);
		
		//кнопка "ОК"
		JButton OK = new JButton("ОК");
		tab3_container.add(OK);
		
		tab_panel_style.add(tab3_container);
	
		//МЕНЮ
		JMenuBar menu = new JMenuBar();
		JMenu file = new JMenu("Файл");
		JMenuItem fileSelectBib = new JMenuItem("Выбрать bib-файл", new ImageIcon("/open-icon.png"));
	   // fileSelectBib.setIcon(new ImageIcon("images/open-icon.png"));
		
		JMenuItem fileSearch = new JMenuItem("Поиск");
		JMenuItem save = new JMenuItem("Сохранить");
		JMenuItem saveAs = new JMenuItem("Сохранить как");
		JMenuItem close = new JMenuItem("ВЫХОД");
		file.add(fileSelectBib);
		setJMenuBar(menu);
		menu.add(file);
		file.add(fileSearch);
		file.addSeparator();
		file.add(save);
		file.add(saveAs);
		file.addSeparator();
		file.add(close);
		JMenu help = new JMenu("Помощь");
		JMenuItem spravka = new JMenuItem("Справка");
		JMenuItem prog = new JMenuItem("О программе");
		help.add(spravka);
		help.addSeparator();
		help.add(prog);
		menu.add(help);
		
		Container c = getContentPane();
		c.setLayout(new GridLayout());
		
		c.add(tabbedPane);
		setSize(900, 660);
		setLocation(hor, vert);
		setVisible(true);
	}
	
	public static void main(String[] args) {
        javax.swing.SwingUtilities.invokeLater(new Runnable() {
            public void run() {
                JFrame.setDefaultLookAndFeelDecorated(true);
                new GUI("Формирование списка литературы");
            }
        });
    }

}