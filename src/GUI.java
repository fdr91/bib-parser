
import java.awt.*;
import java.awt.event.*;
import java.io.File;
import javax.swing.*;
import javax.swing.event.*;

public class GUI extends JFrame {

	JTextField textParam;
	String [] param = {"по автору","по названию","по году", "по индексу"};
		
	public GUI(String str){
		super(str);
		setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		setResizable(false);
	   
		//размер экрана 
		Dimension sSize = Toolkit.getDefaultToolkit ().getScreenSize ();
		int vert = sSize.height;
		int hor  = sSize.width;
		vert = (vert/3)-200;
		hor = (hor/3)-165;
		
		//шрифт
		Font font = new Font("Verdana", Font.PLAIN, 12);
		final JTabbedPane tabbedPane = new JTabbedPane();
		tabbedPane.setFont(font);
		
		//создание вкладок
		JPanel tab_panel1 = new JPanel();
		JPanel tab_panel2 = new JPanel();
		JPanel tab_panel3 = new JPanel();
		
		//установка менеджеров компоновки
		tab_panel1.setLayout(new GridLayout(1,3));
		tab_panel2.setLayout(new GridLayout(1,3));
		tab_panel3.setLayout(new GridLayout(1,3));
		
		//добавление вкладок
		tabbedPane.addTab("Последние проекты", tab_panel1);
		tabbedPane.addTab("Выбор литературы", tab_panel2);
		tabbedPane.addTab("Выбор стиля", tab_panel3);
			
		//ВКЛАДКА 1 **********************************************************************************************
		
		//контейнер
		JPanel panel5 = new JPanel();
		panel5.setLayout(new FlowLayout(FlowLayout.LEFT, 30,20));
		
		//метка "Структура"
		JLabel label9 = new JLabel("Структура");
		label9.setPreferredSize(new Dimension(400,23));
		panel5.add(label9);
		
		//метка "Последние созданные проекты"
		JLabel label10 = new JLabel("Последние созданные проекты");
		label10.setPreferredSize(new Dimension(350,23));
		panel5.add(label10);
		
		//текстовая область "Структура"
		JTextArea prosmotr = new JTextArea(8,5);
		JScrollPane prosmotrscroll=new JScrollPane(prosmotr);
		prosmotrscroll.setPreferredSize(new Dimension(400,450));
		panel5.add(prosmotrscroll);
		
		//текстовая область "Последние созданные проекты"
		JTextArea proekt = new JTextArea(8,5);
		JScrollPane proektscroll=new JScrollPane(proekt);
		proektscroll.setPreferredSize(new Dimension(400,450));
		panel5.add(proektscroll);
		
		//метка-отступ
		JLabel otstup = new JLabel();
		otstup.setPreferredSize(new Dimension(635,25));
		panel5.add(otstup);
		
		//кнопка "Создать новый проект"
		JButton newProject = new JButton("Создать новый проект");
		panel5.add(newProject);
		newProject.addActionListener(new ActionListener(){
			public void actionPerformed(ActionEvent e) {
				tabbedPane.setSelectedIndex(1);				
			}
			
		});
		
		tab_panel1.add(panel5);
	
		// ВКЛАДКА 2**********************************************************************************************
		
		// Блок 1
		
		//контейнер
		JPanel panel1 = new JPanel();
		panel1.setLayout(new FlowLayout(FlowLayout.LEFT, 10,10));
		
		//метка "Путь к bib-файлу"
		JLabel label1 = new JLabel("Путь к bib-файлу");
		label1.setPreferredSize(new Dimension(200,25));
		panel1.add(label1);
		
		//текстовое поле "Введите путь..."
		JTextField textPath = new JTextField("Введите путь...");
		textPath.setPreferredSize(new Dimension(800,25));
		panel1.add(textPath);
		textPath.addMouseListener(new MouseAdapter(){
			public void mouseClicked(MouseEvent e) {
				textPath.setText("");
			}
		});	
		
		//кнопка поиска
		JButton bibSearch = new JButton("...");
		panel1.add(bibSearch);
		bibSearch.addActionListener(new ActionListener() {
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
		
		
		//метка "ПОИСК"
		JLabel label2 = new JLabel("ПОИСК");
		label2.setPreferredSize(new Dimension(800,25));
		panel1.add(label2);
		
		//параметры поиска
		JComboBox paramSearch = new JComboBox(param);
		paramSearch.setPreferredSize(new Dimension(850,25));
		panel1.add(paramSearch);
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
		
		//текстовое поле "Введите значение..."
		textParam = new JTextField("Введите значение...");
		textParam.setPreferredSize(new Dimension(770,25));
		panel1.add(textParam);
		textParam.addMouseListener(new MouseAdapter(){
			public void mouseClicked(MouseEvent e) {
				textParam.setText("");
			}
		});	
		
		//кнопка "НАЙТИ"
		JButton search = new JButton("НАЙТИ");
		panel1.add(search);
		
		// Блок 2	

		//метка "bib-файл"
		JLabel label3 = new JLabel("bib-файл");
		label3.setPreferredSize(new Dimension(470,23));
		panel1.add(label3);
		
		//метка "Выбранная литература"
		JLabel label4 = new JLabel("Выбранная литература");
		label4.setPreferredSize(new Dimension(300,23));
		panel1.add(label4);
				
		//текстовая область "bib-файл"
		JTextArea bibText = new JTextArea(8,5);
		JScrollPane bibscroll=new JScrollPane(bibText);
		bibscroll.setPreferredSize(new Dimension(375,300));
		panel1.add(bibscroll);
	   
		//контейнер кнопок
		JPanel panel33 = new JPanel();
		panel33.setLayout(new BorderLayout(25,25));
		JButton add = new JButton(">>>");
		JButton del = new JButton("<<<");
		JButton clear = new JButton("Очистить");
		panel33.add(add, BorderLayout.NORTH);
		panel33.add(del, BorderLayout.CENTER);
		panel33.add(clear, BorderLayout.SOUTH);
		panel1.add(panel33);
		
		//текстовая область "Выбранная литература"
		JTextArea liter = new JTextArea(8,5);
		JScrollPane literscroll=new JScrollPane(liter);
		literscroll.setPreferredSize(new Dimension(375,300));
		panel1.add(literscroll);
		
		//метка-отступ
		JLabel label5 = new JLabel();
		label5.setPreferredSize(new Dimension(770,25));
		panel1.add(label5);
		
		//кнопка "Далее"
		JButton next = new JButton("Далее");
		panel1.add(next);
		next.addActionListener(new ActionListener(){
			public void actionPerformed(ActionEvent e) {
				tabbedPane.setSelectedIndex(2);				
			}
			
		});
		
		tab_panel2.add(panel1);
		
		//ВКЛАДКА 3**********************************************************************************************
		
		//контейнер
		JPanel panel2 = new JPanel();
		panel2.setLayout(new FlowLayout(FlowLayout.LEFT, 30,20));
		
		//метка "Список литературы"
		JLabel label6 = new JLabel("Список литературы");
		label6.setPreferredSize(new Dimension(400,23));
		
		//метка "Выбор стиля оформления"
		panel2.add(label6);
		JLabel label7 = new JLabel("Выбор стиля оформления");
		label7.setPreferredSize(new Dimension(350,23));
		panel2.add(label7);
		
		// текстовая область "Список литературы"
		JTextArea liter2 = new JTextArea(8,5);
		//liter2.setPreferredSize(new Dimension(400,450));
		JScrollPane liter2scroll=new JScrollPane(liter2);
		liter2scroll.setPreferredSize(new Dimension(400,450));
		panel2.add(liter2scroll);
		
		//// текстовая область "Выбор стиля оформления"
		JTextArea stil = new JTextArea(8,5);
		//stil.setPreferredSize(new Dimension(400,450));
		JScrollPane stilscroll=new JScrollPane(stil);
		stilscroll.setPreferredSize(new Dimension(400,450));
		panel2.add(stilscroll);
		
		//метка-отступ
		JLabel label8 = new JLabel();
		label8.setPreferredSize(new Dimension(400,25));
		panel2.add(label8);
		
		//кнопка "Просмотр"
		JButton preview = new JButton("Просмотр");
		panel2.add(preview);
		
		//кнопка "Добавить другие стили"
		JButton addStyle = new JButton("Добавить другие стили");
		panel2.add(addStyle);
		
		//кнопка "ОК"
		JButton OK = new JButton("ОК");
		panel2.add(OK);
		
		tab_panel3.add(panel2);
	
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